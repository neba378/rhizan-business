import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatCurrency, formatDate } from '@/lib/utils';
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

const COLORS = ['#173F75', '#315C91', '#4A7CC5', '#16A34A', '#D97706', '#DC2626', '#8B5CF6', '#EC4899'];

export function FinanceOverviewPage() {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);

  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netCashFlow = totalIncome - totalExpenses;
  const outstandingInvoices = invoices.reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);
  const paidInvoicesTotal = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

  // Category breakdown for expense pie chart
  const expenseByCategory: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category.replace(/_/g, ' ');
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + t.amount;
    });

  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  // Bar chart data (Income vs Expense)
  const barData = [
    { name: 'Income', amount: totalIncome, fill: '#16A34A' },
    { name: 'Expenses', amount: totalExpenses, fill: '#DC2626' },
    { name: 'Net Profit', amount: Math.max(0, netCashFlow), fill: '#173F75' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
            Finance Management
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary">
            Cash position, income, business expenses, and invoice receivables
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(totalIncome, defaultCurrency)}
          icon={TrendingUp}
          iconBg="bg-state-success-bg"
          iconColor="text-state-success"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses, defaultCurrency)}
          icon={TrendingDown}
          iconBg="bg-state-danger-bg"
          iconColor="text-state-danger"
        />
        <StatCard
          title="Net Cash Flow"
          value={formatCurrency(netCashFlow, defaultCurrency)}
          icon={DollarSign}
          iconBg="bg-brand-primary/10"
          iconColor="text-brand-primary"
        />
        <StatCard
          title="Outstanding Receivables"
          value={formatCurrency(outstandingInvoices, defaultCurrency)}
          icon={Receipt}
          iconBg="bg-state-warning-bg"
          iconColor="text-state-warning"
        />
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cash Flow Comparison */}
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Income vs. Expense Breakdown</CardTitle>
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
            <CardTitle className="text-base">Expense Categories Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-xs text-content-tertiary">No expense records yet</p>
            ) : (
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
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Ledger Entries */}
      <Card className="border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Ledger Activity</CardTitle>
          <Link to="/finance/transactions">
            <Button variant="ghost" size="sm" className="text-xs text-brand-primary">
              View All ({transactions.length})
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      t.type === 'income' ? 'bg-state-success-bg text-state-success' : 'bg-state-danger-bg text-state-danger'
                    }`}
                  >
                    {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-content-primary">{t.title}</p>
                    <p className="text-[11px] text-content-secondary capitalize">
                      {formatDate(t.date, 'short')} · {t.category.replace(/_/g, ' ')} · {t.paymentMethod.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
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
        </CardContent>
      </Card>
    </div>
  );
}
