import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import {
  formatCurrency,
  formatDate,
  isToday,
  isThisWeek,
  isThisMonth,
  matchesTimePeriod,
} from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  PieChart as PieIcon,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { QuickExpenseWidget } from '@/features/finance/quick-expense-widget';
import type { TimePeriod } from '@/lib/types';

const COLORS = ['#173F75', '#315C91', '#4A7CC5', '#16A34A', '#D97706', '#DC2626', '#8B5CF6', '#EC4899'];

export function FinanceOverviewPage() {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all');

  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const customCategories = useLiveQuery(() => db.customCategories.toArray()) || [];

  // Filtered by selected period (Daily / Weekly / Monthly / All)
  const filteredTransactions = transactions.filter((t) =>
    matchesTimePeriod(t.date, selectedPeriod)
  );

  const periodIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const periodExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const periodNet = periodIncome - periodExpenses;

  // Breakdown for Comparison Matrix (Daily, Weekly, Monthly)
  const todayTx = transactions.filter((t) => isToday(t.date));
  const todayIncome = todayTx.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const todayExpenses = todayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const todayNet = todayIncome - todayExpenses;

  const weekTx = transactions.filter((t) => isThisWeek(t.date));
  const weekIncome = weekTx.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const weekExpenses = weekTx.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const weekNet = weekIncome - weekExpenses;

  const monthTx = transactions.filter((t) => isThisMonth(t.date));
  const monthIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const monthExpenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const monthNet = monthIncome - monthExpenses;

  const outstandingInvoices = invoices.reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);

  // Category breakdown for expense pie chart based on filtered period
  const expenseByCategory: Record<string, { total: number; color?: string }> = {};
  filteredTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const match = customCategories.find((c) => c.name === t.category || c.id === t.category);
      const catLabel = match ? match.name : t.category.replace(/_/g, ' ');
      if (!expenseByCategory[catLabel]) {
        expenseByCategory[catLabel] = { total: 0, color: match?.color };
      }
      expenseByCategory[catLabel].total += t.amount;
    });

  const pieData = Object.entries(expenseByCategory)
    .map(([name, data], idx) => ({
      name,
      value: data.total,
      color: data.color || COLORS[idx % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  // Bar chart data for active period
  const barData = [
    { name: 'Income', amount: periodIncome, fill: '#16A34A' },
    { name: 'Expenses', amount: periodExpenses, fill: '#DC2626' },
    { name: 'Net Flow', amount: Math.max(0, periodNet), fill: '#173F75' },
  ];

  const periodLabels: Record<TimePeriod, string> = {
    today: 'Daily (Today)',
    week: 'Weekly (Last 7 Days)',
    month: 'Monthly (This Month)',
    all: 'All Time',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
            Finance Management
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary">
            Daily, weekly & monthly cash flows, expense presets & receivables
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/finance/transactions">
            <Button size="sm" variant="outline">
              <Receipt className="h-4 w-4 mr-1.5" />
              Transactions
            </Button>
          </Link>
          <Link to="/finance/invoices">
            <Button size="sm" variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              Invoices
            </Button>
          </Link>
          <Link to="/finance/budgets">
            <Button size="sm" variant="outline">
              <PieIcon className="h-4 w-4 mr-1.5" />
              Budgets
            </Button>
          </Link>
        </div>
      </div>

      {/* QUICK EXPENSE PRESETS & ADD-ON TAB WIDGET */}
      <Card className="border-border shadow-card bg-surface-card">
        <CardContent className="p-3 sm:p-4">
          <QuickExpenseWidget />
        </CardContent>
      </Card>

      {/* TIMEFRAME SELECTOR: DAILY, WEEKLY, MONTHLY, ALL TIME */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card border border-border rounded-xl p-3 shadow-card">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand-primary" />
          <span className="text-xs font-bold text-content-primary">View Financial Data By:</span>
          <Badge variant="outline" className="text-xs text-brand-primary border-brand-primary/30">
            {periodLabels[selectedPeriod]}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 bg-surface-bg p-1 rounded-lg border border-border self-start sm:self-auto">
          {(
            [
              { id: 'today', label: 'Daily (Today)' },
              { id: 'week', label: 'Weekly' },
              { id: 'month', label: 'Monthly' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPeriod(p.id)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                selectedPeriod === p.id
                  ? 'bg-brand-primary text-white shadow-2xs'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-hover'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards (Reacts to Selected Period) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title={`Income (${periodLabels[selectedPeriod].split(' ')[0]})`}
          value={formatCurrency(periodIncome, defaultCurrency)}
          icon={TrendingUp}
          iconBg="bg-state-success-bg"
          iconColor="text-state-success"
        />
        <StatCard
          title={`Expenses (${periodLabels[selectedPeriod].split(' ')[0]})`}
          value={formatCurrency(periodExpenses, defaultCurrency)}
          icon={TrendingDown}
          iconBg="bg-state-danger-bg"
          iconColor="text-state-danger"
        />
        <StatCard
          title={`Net Flow (${periodLabels[selectedPeriod].split(' ')[0]})`}
          value={formatCurrency(periodNet, defaultCurrency)}
          icon={DollarSign}
          iconBg="bg-brand-primary/10"
          iconColor={periodNet >= 0 ? 'text-brand-primary' : 'text-state-danger'}
        />
        <StatCard
          title="Receivables Due"
          value={formatCurrency(outstandingInvoices, defaultCurrency)}
          icon={Receipt}
          iconBg="bg-state-warning-bg"
          iconColor="text-state-warning"
        />
      </div>

      {/* CADENCE MATRIX: DAILY VS WEEKLY VS MONTHLY COMPARISON */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand-primary" />
              <span>Financial Cadence Matrix (Daily · Weekly · Monthly)</span>
            </CardTitle>
            <span className="text-xs text-content-secondary">3-Tier Business Performance</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Daily Card */}
            <div
              onClick={() => setSelectedPeriod('today')}
              className={`rounded-lg border p-3.5 transition-all cursor-pointer ${
                selectedPeriod === 'today'
                  ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/30'
                  : 'border-border bg-surface-bg hover:border-brand-primary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-content-primary">Daily (Today)</span>
                <span className="text-[10px] text-content-tertiary">{todayTx.length} records</span>
              </div>
              <div className="mt-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-content-secondary">Income:</span>
                  <span className="font-semibold text-state-success">
                    +{formatCurrency(todayIncome, defaultCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-content-secondary">Expenses:</span>
                  <span className="font-semibold text-state-danger">
                    -{formatCurrency(todayExpenses, defaultCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <span className="font-bold text-content-primary">Net Cash:</span>
                  <span className={`font-bold ${todayNet >= 0 ? 'text-brand-primary' : 'text-state-danger'}`}>
                    {formatCurrency(todayNet, defaultCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Card */}
            <div
              onClick={() => setSelectedPeriod('week')}
              className={`rounded-lg border p-3.5 transition-all cursor-pointer ${
                selectedPeriod === 'week'
                  ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/30'
                  : 'border-border bg-surface-bg hover:border-brand-primary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-content-primary">Weekly (This Week)</span>
                <span className="text-[10px] text-content-tertiary">{weekTx.length} records</span>
              </div>
              <div className="mt-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-content-secondary">Income:</span>
                  <span className="font-semibold text-state-success">
                    +{formatCurrency(weekIncome, defaultCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-content-secondary">Expenses:</span>
                  <span className="font-semibold text-state-danger">
                    -{formatCurrency(weekExpenses, defaultCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <span className="font-bold text-content-primary">Net Cash:</span>
                  <span className={`font-bold ${weekNet >= 0 ? 'text-brand-primary' : 'text-state-danger'}`}>
                    {formatCurrency(weekNet, defaultCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Card */}
            <div
              onClick={() => setSelectedPeriod('month')}
              className={`rounded-lg border p-3.5 transition-all cursor-pointer ${
                selectedPeriod === 'month'
                  ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/30'
                  : 'border-border bg-surface-bg hover:border-brand-primary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-content-primary">Monthly (This Month)</span>
                <span className="text-[10px] text-content-tertiary">{monthTx.length} records</span>
              </div>
              <div className="mt-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-content-secondary">Income:</span>
                  <span className="font-semibold text-state-success">
                    +{formatCurrency(monthIncome, defaultCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-content-secondary">Expenses:</span>
                  <span className="font-semibold text-state-danger">
                    -{formatCurrency(monthExpenses, defaultCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <span className="font-bold text-content-primary">Net Cash:</span>
                  <span className={`font-bold ${monthNet >= 0 ? 'text-brand-primary' : 'text-state-danger'}`}>
                    {formatCurrency(monthNet, defaultCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cash Flow Comparison */}
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">
              Income vs. Expense Breakdown ({periodLabels[selectedPeriod]})
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F8" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [
                    formatCurrency(Number(val) || 0, defaultCurrency),
                    'Amount',
                  ]}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Distribution */}
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">
              Expense Categories ({periodLabels[selectedPeriod]})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-content-tertiary">
                No expense records recorded in {periodLabels[selectedPeriod].toLowerCase()}
              </div>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [
                          formatCurrency(Number(val) || 0, defaultCurrency),
                          'Spent',
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider">
                    Where Your Money Is Going ({periodLabels[selectedPeriod]})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {pieData.map((item) => {
                      const pct = periodExpenses > 0 ? Math.round((item.value / periodExpenses) * 100) : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-surface-bg border border-border/70">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="truncate font-medium text-content-primary">{item.name}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-content-primary block">{formatCurrency(item.value, defaultCurrency)}</span>
                            <span className="text-[10px] text-content-tertiary font-semibold">{pct}% of total</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Ledger Entries */}
      <Card className="border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Ledger Activity ({periodLabels[selectedPeriod]})</CardTitle>
            <p className="text-xs text-content-secondary mt-0.5">
              Showing {filteredTransactions.length} recorded entries
            </p>
          </div>
          <Link to="/finance/transactions">
            <Button variant="ghost" size="sm" className="text-xs text-brand-primary">
              View Transactions <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-xs text-content-tertiary py-8 text-center">
              No transactions recorded for this period yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filteredTransactions.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        t.type === 'income'
                          ? 'bg-state-success-bg text-state-success'
                          : 'bg-state-danger-bg text-state-danger'
                      }`}
                    >
                      {t.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-xs font-semibold text-content-primary truncate">{t.title}</p>
                      <p className="text-[11px] text-content-secondary capitalize">
                        {formatDate(t.date, 'short')} · {t.category.replace(/_/g, ' ')} ·{' '}
                        {t.paymentMethod.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs font-bold ${
                        t.type === 'income' ? 'text-state-success' : 'text-state-danger'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount, defaultCurrency)}
                    </p>
                    <span className="text-[10px] text-content-tertiary uppercase">{t.syncStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
