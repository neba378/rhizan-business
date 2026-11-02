import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatCurrency, formatDate, getGreeting, generateId, matchesTimePeriod } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Users,
  Briefcase,
  Video,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Receipt,
  FilePlus,
  UserPlus,
  Calendar,
  AlertCircle,
  Eye,
  Heart,
  Share2,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { normalizePipelineStage } from '@/features/clients/pipeline-page';
import { QuickExpenseWidget } from '@/features/finance/quick-expense-widget';
import type { TransactionType, IncomeCategory, ExpenseCategory, Priority, PipelineStage, ContentPillar, Platform, TimePeriod } from '@/lib/types';

export function DashboardPage() {
  const userName = useAuthStore((s) => s.userName) || 'Founder';
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);

  // Quick Action Dialogs State
  const [quickIncomeOpen, setQuickIncomeOpen] = useState(false);
  const [quickExpenseOpen, setQuickExpenseOpen] = useState(false);
  const [quickProspectOpen, setQuickProspectOpen] = useState(false);
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);

  // Form states
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState<string>('client_project');

  const [prospectName, setProspectName] = useState('');
  const [prospectIndustry, setProspectIndustry] = useState('');
  const [prospectContact, setProspectContact] = useState('');
  const [prospectValue, setProspectValue] = useState('');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('high');
  const [taskModule, setTaskModule] = useState<'finance' | 'clients' | 'marketing' | 'general'>('general');

  // Real-time live queries
  const transactions = useLiveQuery(() => db.transactions.toArray()) || [];
  const prospects = useLiveQuery(() => db.prospects.toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const contentItems = useLiveQuery(() => db.contentItems.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const meetings = useLiveQuery(() => db.meetings.toArray()) || [];
  const performance = useLiveQuery(() => db.contentPerformance.toArray()) || [];

  const totalInquiries = performance.reduce((sum, p) => sum + (p.businessInquiries || 0), 0);

  // Financial Period Filter (Daily / Weekly / Monthly / All)
  const [financePeriod, setFinancePeriod] = useState<TimePeriod>('all');
  const filteredFinanceTx = transactions.filter((t) => matchesTimePeriod(t.date, financePeriod));

  const totalIncome = filteredFinanceTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = filteredFinanceTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netCashFlow = totalIncome - totalExpenses;

  const outstandingInvoices = invoices.reduce((sum, inv) => sum + (inv.outstandingAmount || 0), 0);

  // Client Pipeline Metrics
  const totalProspectsCount = prospects.length;
  const activePipelineValue = prospects
    .filter((p) => {
      const s = normalizePipelineStage(p.stage);
      return s !== 'rejected' && s !== 'deal';
    })
    .reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
  const wonDealsCount = prospects.filter((p) => normalizePipelineStage(p.stage) === 'deal').length;
  const proposalsSentCount = prospects.filter((p) => normalizePipelineStage(p.stage) === 'proposal').length;

  // Task Priorities
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const todayTasks = pendingTasks.slice(0, 5);

  // Marketing Metrics
  const publishedContentCount = contentItems.filter((c) => c.status === 'published').length;
  const scheduledContentCount = contentItems.filter((c) => c.status === 'scheduled' || c.status === 'ready_to_record' || c.status === 'editing').length;

  // Handle Quick Add Income
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return;
    const amountVal = parseFloat(txAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    await db.transactions.add({
      id: generateId(),
      title: txTitle,
      amount: amountVal,
      type: 'income',
      category: txCategory as IncomeCategory,
      date: new Date().toISOString(),
      paymentMethod: 'bank_transfer',
      currency: defaultCurrency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success(`Recorded income: ${formatCurrency(amountVal, defaultCurrency)}`);
    setTxTitle('');
    setTxAmount('');
    setQuickIncomeOpen(false);
  };

  // Handle Quick Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return;
    const amountVal = parseFloat(txAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    await db.transactions.add({
      id: generateId(),
      title: txTitle,
      amount: amountVal,
      type: 'expense',
      category: (txCategory || 'other_expenses') as ExpenseCategory,
      date: new Date().toISOString(),
      paymentMethod: 'mobile_money',
      currency: defaultCurrency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success(`Recorded expense: ${formatCurrency(amountVal, defaultCurrency)}`);
    setTxTitle('');
    setTxAmount('');
    setQuickExpenseOpen(false);
  };

  // Handle Quick Add Prospect
  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectName || !prospectContact) return;

    const estVal = parseFloat(prospectValue) || 0;

    await db.prospects.add({
      id: generateId(),
      businessName: prospectName,
      industry: prospectIndustry || 'General Business',
      contactName: prospectContact,
      estimatedValue: estVal,
      leadSource: 'cold_outreach',
      priority: 'high',
      stage: 'new_lead',
      assignedTo: 'Neba',
      currency: defaultCurrency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success(`Added new prospect: ${prospectName}`);
    setProspectName('');
    setProspectIndustry('');
    setProspectContact('');
    setProspectValue('');
    setQuickProspectOpen(false);
  };

  // Handle Quick Add Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    await db.tasks.add({
      id: generateId(),
      title: taskTitle,
      module: taskModule,
      priority: taskPriority,
      status: 'todo',
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success('Priority task scheduled');
    setTaskTitle('');
    setQuickTaskOpen(false);
  };

  // Handle Complete Task inline
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'todo' : 'completed';
    await db.tasks.update(taskId, {
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
    toast.success(nextStatus === 'completed' ? 'Task marked as completed' : 'Task reopened');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              {getGreeting()}, {userName}
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px] text-brand-primary border-brand-primary/30">
              Business Growth & Marketing
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-content-secondary mt-0.5">
            {formatDate(new Date(), 'long')} · Weekly Execution & Accountability
          </p>
        </div>

        {/* Quick action pill buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setTxCategory('client_project');
              setQuickIncomeOpen(true);
            }}
            className="bg-state-success hover:bg-green-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Income</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTxCategory('internet');
              setQuickExpenseOpen(true);
            }}
            className="border-state-danger/30 text-state-danger hover:bg-state-danger-bg"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Expense</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setQuickProspectOpen(true)}
            className="text-brand-primary border-brand-primary/30 hover:bg-brand-primary/5"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Prospect</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setQuickTaskOpen(true)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Task</span>
          </Button>
        </div>
      </div>

      {/* 1. FINANCIAL HEALTH OVERVIEW */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-primary/10 text-brand-primary">
              <Wallet className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-content-primary uppercase">
              Financial Position
            </h2>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Daily, Weekly, Monthly Filter Pills */}
            <div className="flex items-center gap-1 bg-surface-bg p-0.5 rounded-lg border border-border">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'Week' },
                  { id: 'month', label: 'Month' },
                  { id: 'all', label: 'All' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setFinancePeriod(p.id)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    financePeriod === p.id
                      ? 'bg-brand-primary text-white shadow-2xs'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Link
              to="/finance"
              className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Full Ledger</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            title={
              financePeriod === 'today'
                ? "Today's Revenue"
                : financePeriod === 'week'
                ? "This Week's Revenue"
                : financePeriod === 'month'
                ? "This Month's Revenue"
                : "Total Revenue"
            }
            value={formatCurrency(totalIncome, defaultCurrency)}
            icon={TrendingUp}
            iconBg="bg-state-success-bg"
            iconColor="text-state-success"
          />

          <StatCard
            title={
              financePeriod === 'today'
                ? "Today's Expenses"
                : financePeriod === 'week'
                ? "This Week's Expenses"
                : financePeriod === 'month'
                ? "This Month's Expenses"
                : "Total Expenses"
            }
            value={formatCurrency(totalExpenses, defaultCurrency)}
            icon={TrendingDown}
            iconBg="bg-state-danger-bg"
            iconColor="text-state-danger"
          />

          <StatCard
            title={
              financePeriod === 'today'
                ? "Today's Net"
                : financePeriod === 'week'
                ? "This Week's Net"
                : financePeriod === 'month'
                ? "This Month's Net"
                : "Available Cash"
            }
            value={formatCurrency(netCashFlow, defaultCurrency)}
            icon={DollarSign}
            iconBg="bg-brand-primary/10"
            iconColor={netCashFlow >= 0 ? "text-brand-primary" : "text-state-danger"}
          />

          <StatCard
            title="Receivables Due"
            value={formatCurrency(outstandingInvoices, defaultCurrency)}
            icon={Receipt}
            iconBg="bg-state-warning-bg"
            iconColor="text-state-warning"
          />
        </div>

        {/* Quick Expense Presets & Add-on Tab */}
        <Card className="border-border shadow-card bg-surface-card mt-2">
          <CardContent className="p-3">
            <QuickExpenseWidget />
          </CardContent>
        </Card>
      </section>

      {/* 2. DUAL COLUMN: CLIENT PIPELINE & MARKETING SNAPSHOT */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Client Outreach & CRM Pipeline */}
        <Card className="border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-primary" />
                <span>Sales Pipeline & Prospects</span>
              </CardTitle>
              <p className="text-xs text-content-secondary mt-0.5">
                Active opportunities converting to paying clients
              </p>
            </div>
            <Link to="/clients/pipeline">
              <Button variant="ghost" size="sm" className="text-xs text-brand-primary">
                Kanban <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface-bg p-3 border border-border text-center">
              <div>
                <p className="text-xs text-content-secondary">Pipeline Value</p>
                <p className="text-sm font-bold text-content-primary">
                  {formatCurrency(activePipelineValue, defaultCurrency)}
                </p>
              </div>
              <div className="border-x border-border">
                <p className="text-xs text-content-secondary">Proposals Sent</p>
                <p className="text-sm font-bold text-brand-primary">{proposalsSentCount}</p>
              </div>
              <div>
                <p className="text-xs text-content-secondary">Deals Closed</p>
                <p className="text-sm font-bold text-state-success">{wonDealsCount}</p>
              </div>
            </div>

            {/* Recent Prospects List */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Active Prospects
              </p>
              {prospects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-content-tertiary">
                  No prospects added yet. Click "+ Prospect" to record your first client.
                </div>
              ) : (
                prospects.slice(0, 3).map((p) => {
                  const normStage = normalizePipelineStage(p.stage);
                  const stageLabels: Record<string, string> = {
                    new_lead: 'New Lead',
                    followup: p.followUpType === 'visit' ? 'To Go' : 'To Call',
                    requirement: 'Requirement',
                    proposal: 'Proposal',
                    deal: 'Deal Handed Over',
                    rejected: 'Rejected',
                  };
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border p-2.5 hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-xs font-semibold text-content-primary truncate">
                          {p.businessName}
                        </span>
                        <span className="text-[11px] text-content-secondary">
                          {p.contactName} · {p.industry}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={normStage === 'deal' ? 'success' : normStage === 'followup' ? 'warning' : 'outline'}
                          className="text-[10px] capitalize"
                        >
                          {stageLabels[normStage] || normStage}
                        </Badge>
                        <span className="text-xs font-bold text-content-primary">
                          {formatCurrency(p.estimatedValue, defaultCurrency)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* TikTok & Social Media Content */}
        <Card className="border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4 text-brand-primary" />
                <span>TikTok & Social Growth</span>
              </CardTitle>
              <p className="text-xs text-content-secondary mt-0.5">
                Brand building & founder-led inbound inquiries
              </p>
            </div>
            <Link to="/marketing/calendar">
              <Button variant="ghost" size="sm" className="text-xs text-brand-primary">
                Calendar <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface-bg p-3 border border-border text-center">
              <div>
                <p className="text-xs text-content-secondary">Published</p>
                <p className="text-sm font-bold text-state-success">{publishedContentCount}</p>
              </div>
              <div className="border-x border-border">
                <p className="text-xs text-content-secondary">In Production</p>
                <p className="text-sm font-bold text-brand-primary">{scheduledContentCount}</p>
              </div>
              <div>
                <p className="text-xs text-content-secondary">TikTok Inquiries</p>
                <p className="text-sm font-bold text-state-warning">{totalInquiries} leads</p>
              </div>
            </div>

            {/* Content Pipeline Highlights */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Current Content Items
              </p>
              {contentItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-content-tertiary">
                  No content planned yet. Click "Plan Content" to schedule your first post.
                </div>
              ) : (
                contentItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border p-2.5 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-semibold text-content-primary truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-content-secondary capitalize">
                        {item.pillar.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <Badge
                      variant={item.status === 'published' ? 'success' : 'default'}
                      className="text-[10px] capitalize shrink-0"
                    >
                      {item.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. TODAY'S PRIORITIES & SCHEDULED FOLLOW-UPS */}
      <Card className="border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-state-success" />
              <span>Today's Priorities & Action Items</span>
            </CardTitle>
            <p className="text-xs text-content-secondary mt-0.5">
              Direct accountability: click any task to complete
            </p>
          </div>
          <Link to="/tasks">
            <Button variant="ghost" size="sm" className="text-xs text-brand-primary">
              All Tasks ({pendingTasks.length}) <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <p className="text-xs text-content-tertiary py-4 text-center">
              All tasks for today completed! You are fully on track.
            </p>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t.id!, t.status)}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={t.status === 'completed'}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary"
                    />
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-xs font-medium text-content-primary truncate ${
                          t.status === 'completed' ? 'line-through text-content-tertiary' : ''
                        }`}
                      >
                        {t.title}
                      </span>
                      {t.dueDate && (
                        <span className="text-[10px] text-content-secondary flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-content-tertiary" />
                          <span>Due: {formatDate(t.dueDate, 'short')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        t.priority === 'urgent'
                          ? 'danger'
                          : t.priority === 'high'
                          ? 'warning'
                          : 'secondary'
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {t.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QUICK ADD INCOME DIALOG */}
      <Dialog open={quickIncomeOpen} onOpenChange={setQuickIncomeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Income</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddIncome} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label required>Income Title / Description</Label>
              <Input
                placeholder="e.g. Website payment from client"
                value={txTitle}
                onChange={(e) => setTxTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label required>Amount ({defaultCurrency})</Label>
              <Input
                type="number"
                placeholder="45000"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={txCategory} onValueChange={setTxCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client_project">Client Project Payment</SelectItem>
                  <SelectItem value="consulting">Consulting & Advisory</SelectItem>
                  <SelectItem value="product_revenue">Product / SaaS Revenue</SelectItem>
                  <SelectItem value="remote_contracts">Remote Contracts</SelectItem>
                  <SelectItem value="other_income">Other Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQuickIncomeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-state-success hover:bg-green-700">
                Save Income
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QUICK ADD EXPENSE DIALOG */}
      <Dialog open={quickExpenseOpen} onOpenChange={setQuickExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Expense / Add to Daily Tab</DialogTitle>
          </DialogHeader>
          <div className="pt-1 pb-2 border-b border-border/70">
            <QuickExpenseWidget onExpenseAdded={() => setQuickExpenseOpen(false)} />
          </div>
          <form onSubmit={handleAddExpense} className="space-y-4 pt-1">
            <p className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider">
              Or Record Custom Expense:
            </p>
            <div className="space-y-1.5">
              <Label required>Expense Name</Label>
              <Input
                placeholder="e.g. Office Fiber Internet bill"
                value={txTitle}
                onChange={(e) => setTxTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label required>Amount ({defaultCurrency})</Label>
              <Input
                type="number"
                placeholder="3500"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={txCategory} onValueChange={setTxCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internet">Internet & Connectivity</SelectItem>
                  <SelectItem value="software_subscriptions">Software & Subscriptions</SelectItem>
                  <SelectItem value="marketing">Marketing & Production</SelectItem>
                  <SelectItem value="transportation">Transportation & Commute</SelectItem>
                  <SelectItem value="office_expenses">Office Expenses</SelectItem>
                  <SelectItem value="employee_payments">Payroll & Contractor Fees</SelectItem>
                  <SelectItem value="infrastructure">Hosting & Infrastructure</SelectItem>
                  <SelectItem value="other_expenses">Other Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQuickExpenseOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Save Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QUICK ADD PROSPECT DIALOG */}
      <Dialog open={quickProspectOpen} onOpenChange={setQuickProspectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Potential Client Prospect</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProspect} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label required>Business Name</Label>
              <Input
                placeholder="e.g. Lucy Leather Goods"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input
                placeholder="e.g. Manufacturing / Export"
                value={prospectIndustry}
                onChange={(e) => setProspectIndustry(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label required>Key Contact Person</Label>
              <Input
                placeholder="e.g. Abebe Kebede (Managing Director)"
                value={prospectContact}
                onChange={(e) => setProspectContact(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estimated Deal Value ({defaultCurrency})</Label>
              <Input
                type="number"
                placeholder="75000"
                value={prospectValue}
                onChange={(e) => setProspectValue(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQuickProspectOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add to Pipeline
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QUICK ADD TASK DIALOG */}
      <Dialog open={quickTaskOpen} onOpenChange={setQuickTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Priority Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label required>Task Description</Label>
              <Input
                placeholder="e.g. Follow up with Zemen Bank regarding contract"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={taskPriority} onValueChange={(v) => setTaskPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Module</Label>
                <Select value={taskModule} onValueChange={(v) => setTaskModule(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Operations</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="clients">Client CRM</SelectItem>
                    <SelectItem value="marketing">Social Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQuickTaskOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Schedule Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
