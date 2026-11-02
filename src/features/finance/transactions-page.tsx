import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatCurrency, formatDate, generateId, matchesTimePeriod } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Copy,
  PlusCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { QuickExpenseWidget } from '@/features/finance/quick-expense-widget';
import type { Transaction, TransactionType, IncomeCategory, ExpenseCategory, PaymentMethod, TimePeriod } from '@/lib/types';

export function TransactionsPage() {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray()) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add onto specific transaction modal
  const [targetAddOnTx, setTargetAddOnTx] = useState<Transaction | null>(null);
  const [addOnAmount, setAddOnAmount] = useState<string>('');

  // New transaction form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('office_expenses');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  // Filter transactions by search, type, and daily/weekly/monthly period
  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesPeriod = matchesTimePeriod(t.date, timePeriod);
    return matchesSearch && matchesType && matchesPeriod;
  });

  // Calculate filtered totals
  const periodIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const periodExpenses = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const periodNet = periodIncome - periodExpenses;

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(amount);
    if (!title || isNaN(amountVal) || amountVal <= 0) {
      toast.error('Please enter a valid title and positive amount');
      return;
    }

    const newTx: Transaction = {
      id: generateId(),
      title,
      amount: amountVal,
      type,
      category: category as any,
      paymentMethod,
      description: description || undefined,
      vendorName: vendorName || undefined,
      referenceNumber: referenceNumber || undefined,
      date: new Date().toISOString(),
      currency: defaultCurrency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    await db.transactions.add(newTx);
    toast.success('Transaction registered to ledger');
    setModalOpen(false);
    resetForm();
  };

  const handleConfirmAddOn = async () => {
    if (!targetAddOnTx) return;
    const addVal = parseFloat(addOnAmount);
    if (isNaN(addVal) || addVal <= 0) {
      toast.error('Please enter a valid positive amount to add');
      return;
    }

    const newTotal = targetAddOnTx.amount + addVal;
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const note = `(+${formatCurrency(addVal, defaultCurrency)} added at ${nowTime})`;
    const updatedDesc = targetAddOnTx.description
      ? `${targetAddOnTx.description} · ${note}`
      : note;

    await db.transactions.update(targetAddOnTx.id!, {
      amount: newTotal,
      description: updatedDesc,
      updatedAt: new Date().toISOString(),
    });

    toast.success(
      `Added +${formatCurrency(addVal, defaultCurrency)} onto "${targetAddOnTx.title}". New total: ${formatCurrency(newTotal, defaultCurrency)}`
    );

    setTargetAddOnTx(null);
    setAddOnAmount('');
  };

  const handleDuplicateTransaction = async (t: Transaction) => {
    await db.transactions.add({
      id: generateId(),
      title: t.title,
      amount: t.amount,
      type: t.type,
      category: t.category,
      paymentMethod: t.paymentMethod,
      description: `Logged again from previous entry`,
      date: new Date().toISOString(),
      currency: defaultCurrency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success(`Logged new entry for ${t.title} (${formatCurrency(t.amount, defaultCurrency)})`);
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setType('expense');
    setCategory('office_expenses');
    setDescription('');
    setVendorName('');
    setReferenceNumber('');
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await db.transactions.delete(deleteId);
    toast.success('Transaction deleted');
    setDeleteId(null);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const csvData = transactions.map((t) => ({
      ID: t.id,
      Date: formatDate(t.date, 'short'),
      Title: t.title,
      Type: t.type.toUpperCase(),
      Category: t.category,
      Amount: t.amount,
      Currency: t.currency,
      PaymentMethod: t.paymentMethod,
      Vendor: t.vendorName || '',
      Reference: t.referenceNumber || '',
      Description: t.description || '',
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `RHIZAN_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transactions exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/finance">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-content-primary">
              Transactions Ledger
            </h1>
            <p className="text-xs text-content-secondary">
              Record, add-on, and audit RHIZAN daily, weekly & monthly cash flows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Entry
          </Button>
        </div>
      </div>

      {/* QUICK EXPENSE PRESETS & ADD-ON TAB WIDGET */}
      <Card className="border-border shadow-card bg-surface-card">
        <CardContent className="p-3 sm:p-4">
          <QuickExpenseWidget />
        </CardContent>
      </Card>

      {/* Filter and Search Bar with Daily, Weekly, Monthly Filter */}
      <Card className="border-border shadow-card">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-tertiary" />
              <Input
                placeholder="Search by title, client, or memo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Transaction Type Filters */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
                className="h-8 text-xs"
              >
                All
              </Button>
              <Button
                variant={filterType === 'income' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('income')}
                className={`h-8 text-xs ${filterType === 'income' ? 'bg-state-success hover:bg-green-700' : ''}`}
              >
                Income
              </Button>
              <Button
                variant={filterType === 'expense' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('expense')}
                className={`h-8 text-xs ${filterType === 'expense' ? 'bg-state-danger hover:bg-red-700' : ''}`}
              >
                Expenses
              </Button>
            </div>
          </div>

          {/* Time Period Filter Pills: Daily, Weekly, Monthly */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider mr-1">
                Period:
              </span>
              {(
                [
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Daily (Today)' },
                  { id: 'week', label: 'Weekly (7 Days)' },
                  { id: 'month', label: 'Monthly (This Month)' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTimePeriod(p.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    timePeriod === p.id
                      ? 'bg-brand-primary text-white shadow-2xs'
                      : 'bg-surface-bg text-content-secondary hover:text-content-primary hover:bg-surface-hover'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Filtered Period Figures Summary */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-state-success">
                +{formatCurrency(periodIncome, defaultCurrency)}
              </span>
              <span className="text-state-danger">
                -{formatCurrency(periodExpenses, defaultCurrency)}
              </span>
              <span className={periodNet >= 0 ? 'text-brand-primary' : 'text-state-danger'}>
                Net: {formatCurrency(periodNet, defaultCurrency)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border-border shadow-card">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-content-tertiary">
              No transactions found for the selected {timePeriod === 'all' ? 'filters' : timePeriod} period.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 hover:bg-surface-hover transition-colors gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 pr-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        t.type === 'income'
                          ? 'bg-state-success-bg text-state-success'
                          : 'bg-state-danger-bg text-state-danger'
                      }`}
                    >
                      {t.type === 'income' ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-content-primary truncate">
                          {t.title}
                        </span>
                        {t.type === 'expense' && (
                          <Badge variant="outline" className="text-[10px] hidden sm:inline-flex capitalize">
                            {t.category.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-content-secondary capitalize mt-0.5">
                        {formatDate(t.date, 'short')} · {t.paymentMethod.replace(/_/g, ' ')}
                      </span>
                      {t.description && (
                        <span className="text-[11px] text-content-tertiary mt-0.5 leading-snug">
                          {t.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <div className="text-left sm:text-right">
                      <p
                        className={`text-sm font-bold ${
                          t.type === 'income' ? 'text-state-success' : 'text-state-danger'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount, defaultCurrency)}
                      </p>
                      <span className="text-[9px] uppercase tracking-wider text-content-tertiary">
                        {t.currency}
                      </span>
                    </div>

                    {/* Action buttons: Add on, duplicate, delete */}
                    <div className="flex items-center gap-1">
                      {t.type === 'expense' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTargetAddOnTx(t);
                            setAddOnAmount('');
                          }}
                          className="h-7 px-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                        >
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Add More
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDuplicateTransaction(t)}
                        title="Log again today"
                        className="text-content-tertiary hover:text-content-primary h-7 w-7"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteId(t.id!)}
                        className="text-content-tertiary hover:text-state-danger h-7 w-7"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL: ADD ONTO EXISTING TRANSACTION */}
      <Dialog open={!!targetAddOnTx} onOpenChange={() => setTargetAddOnTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-amber-600" />
              <span>Add onto "{targetAddOnTx?.title}"</span>
            </DialogTitle>
          </DialogHeader>

          {targetAddOnTx && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-surface-bg p-3 border border-border flex items-center justify-between text-xs">
                <span className="text-content-secondary">Current Total:</span>
                <span className="text-sm font-bold text-content-primary">
                  {formatCurrency(targetAddOnTx.amount, defaultCurrency)}
                </span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Quick Amount to Add:</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 150, 200].map((inc) => (
                    <Button
                      key={inc}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAddOnAmount(inc.toString())}
                      className={`text-xs ${
                        addOnAmount === inc.toString()
                          ? 'border-brand-primary bg-brand-primary/10 font-bold'
                          : ''
                      }`}
                    >
                      +{inc} ETB
                    </Button>
                  ))}
                </div>

                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] text-content-secondary">
                    Or custom amount ({defaultCurrency}):
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 75"
                    value={addOnAmount}
                    onChange={(e) => setAddOnAmount(e.target.value)}
                    className="font-semibold"
                  />
                </div>

                {parseFloat(addOnAmount) > 0 && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs flex items-center justify-between font-bold text-amber-900 dark:text-amber-100">
                    <span>New Updated Total:</span>
                    <span className="text-sm">
                      {formatCurrency(
                        targetAddOnTx.amount + (parseFloat(addOnAmount) || 0),
                        defaultCurrency
                      )}
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setTargetAddOnTx(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAddOn}
                  disabled={!addOnAmount || parseFloat(addOnAmount) <= 0}
                  className="bg-brand-primary text-white"
                >
                  Save & Update Total
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE TRANSACTION DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record New Ledger Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTransaction} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === 'income' ? 'default' : 'outline'}
                onClick={() => {
                  setType('income');
                  setCategory('client_project');
                }}
                className={type === 'income' ? 'bg-state-success hover:bg-green-700' : ''}
              >
                Income
              </Button>
              <Button
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'}
                onClick={() => {
                  setType('expense');
                  setCategory('office_expenses');
                }}
                className={type === 'expense' ? 'bg-state-danger hover:bg-red-700' : ''}
              >
                Expense
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label required>Title / Description</Label>
              <Input
                placeholder={type === 'income' ? 'e.g. Client Milestone Payment' : 'e.g. Injera for team lunch, Internet bill'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Amount ({defaultCurrency})</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile_money">Telebirr / Mobile Money</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">CBE / Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="online">Online / Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {type === 'income' ? (
                    <>
                      <SelectItem value="client_project">Client Project Payments</SelectItem>
                      <SelectItem value="consulting">Consulting & Advisory</SelectItem>
                      <SelectItem value="product_revenue">Product Revenue</SelectItem>
                      <SelectItem value="remote_contracts">Remote Contracts</SelectItem>
                      <SelectItem value="other_income">Other Income</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="office_expenses">Office & Meals (Injera, Buna)</SelectItem>
                      <SelectItem value="transportation">Transportation & Taxi</SelectItem>
                      <SelectItem value="internet">Internet & Telecom</SelectItem>
                      <SelectItem value="software_subscriptions">Software & Tools</SelectItem>
                      <SelectItem value="marketing">Marketing & Content</SelectItem>
                      <SelectItem value="employee_payments">Team & Contractor Payments</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure & Office</SelectItem>
                      <SelectItem value="other_expenses">Other Expenses</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes / Memo</Label>
              <Input
                placeholder="Additional memo or reference notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this ledger record? This will update your cash flow figures.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-state-danger text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
