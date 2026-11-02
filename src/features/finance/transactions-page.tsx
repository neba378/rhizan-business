import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatCurrency, formatDate, generateId } from '@/lib/utils';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import Papa from 'papaparse';
import type { Transaction, TransactionType, IncomeCategory, ExpenseCategory, PaymentMethod } from '@/lib/types';

export function TransactionsPage() {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray()) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // New transaction form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('income');
  const [category, setCategory] = useState<string>('client_project');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [description, setDescription] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const filtered = transactions.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

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

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setType('income');
    setCategory('client_project');
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
              Record and audit all RHIZAN revenue and expenses
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

      {/* Filter and Search Bar */}
      <Card className="border-border shadow-card">
        <CardContent className="p-3 sm:p-4">
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

            <div className="flex items-center gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button
                variant={filterType === 'income' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('income')}
                className={filterType === 'income' ? 'bg-state-success hover:bg-green-700' : ''}
              >
                Income
              </Button>
              <Button
                variant={filterType === 'expense' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('expense')}
                className={filterType === 'expense' ? 'bg-state-danger hover:bg-red-700' : ''}
              >
                Expenses
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border-border shadow-card">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-content-tertiary">
              No transactions found matching your criteria.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
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
                      <span className="text-sm font-semibold text-content-primary truncate">
                        {t.title}
                      </span>
                      <span className="text-xs text-content-secondary capitalize">
                        {formatDate(t.date, 'short')} · {t.category.replace(/_/g, ' ')} ·{' '}
                        {t.paymentMethod.replace(/_/g, ' ')}
                      </span>
                      {t.description && (
                        <span className="text-[11px] text-content-tertiary truncate mt-0.5">
                          {t.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${
                          t.type === 'income' ? 'text-state-success' : 'text-state-danger'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount, defaultCurrency)}
                      </p>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                        {t.syncStatus}
                      </Badge>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteId(t.id!)}
                      className="text-content-tertiary hover:text-state-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE TRANSACTION DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record New Transaction</DialogTitle>
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
                  setCategory('internet');
                }}
                className={type === 'expense' ? 'bg-state-danger hover:bg-red-700' : ''}
              >
                Expense
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label required>Title / Description</Label>
              <Input
                placeholder={type === 'income' ? 'e.g. Client Milestone Payment' : 'e.g. Office Internet Bill'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

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
                      <SelectItem value="product_revenue">Product & SaaS Revenue</SelectItem>
                      <SelectItem value="remote_contracts">Remote Contracts</SelectItem>
                      <SelectItem value="other_income">Other Income</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="internet">Internet & Connectivity</SelectItem>
                      <SelectItem value="software_subscriptions">Software Subscriptions</SelectItem>
                      <SelectItem value="marketing">Marketing & Production</SelectItem>
                      <SelectItem value="transportation">Transportation & Fuel</SelectItem>
                      <SelectItem value="office_expenses">Office & Workspace</SelectItem>
                      <SelectItem value="employee_payments">Salaries & Contractor Fees</SelectItem>
                      <SelectItem value="infrastructure">Hosting & Servers</SelectItem>
                      <SelectItem value="other_expenses">Other Expenses</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer (CBE / Awash / Dashen)</SelectItem>
                  <SelectItem value="mobile_money">telebirr / CBE Birr</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online Card Payment</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Memo / Notes</Label>
              <Input
                placeholder="Optional details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Record Entry</Button>
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
              This will permanently remove this record from your local financial ledger.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-state-danger hover:bg-red-700">
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
