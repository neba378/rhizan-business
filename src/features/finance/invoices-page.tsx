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
  FileDown,
  CreditCard,
  Trash2,
  ArrowLeft,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, InvoiceItem, InvoiceStatus, PaymentMethod } from '@/lib/types';

export function InvoicesPage() {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const companyName = useAppStore((s) => s.companyName);
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const prospects = useLiveQuery(() => db.prospects.toArray()) || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);

  const confirmDeleteInvoice = async () => {
    if (!deleteInvoiceId) return;
    await db.invoices.delete(deleteInvoiceId);
    toast.success('Invoice deleted');
    setDeleteInvoiceId(null);
  };

  // New Invoice Form
  const [invoiceNumber, setInvoiceNumber] = useState(`RHZ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [clientName, setClientName] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(itemQty) || 1;
    const price = parseFloat(itemPrice) || 0;
    const total = qty * price;

    if (!clientName || total <= 0) {
      toast.error('Please enter client name and valid item details');
      return;
    }

    const newInvoice: Invoice = {
      id: generateId(),
      invoiceNumber,
      clientId: prospects.find((p) => p.businessName === clientName)?.id || generateId(),
      clientName,
      issueDate: new Date().toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      items: [
        {
          id: generateId(),
          description: itemDesc || 'Professional Software Consulting & Development Services',
          quantity: qty,
          unitPrice: price,
          total,
        },
      ],
      subtotal: total,
      totalAmount: total,
      paidAmount: 0,
      outstandingAmount: total,
      status: 'sent',
      payments: [],
      currency: defaultCurrency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    await db.invoices.add(newInvoice);
    toast.success(`Invoice ${invoiceNumber} created`);
    setModalOpen(false);
    resetInvoiceForm();
  };

  const resetInvoiceForm = () => {
    setInvoiceNumber(`RHZ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setClientName('');
    setItemDesc('');
    setItemQty('1');
    setItemPrice('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const payVal = parseFloat(paymentAmount);
    if (isNaN(payVal) || payVal <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const newPaidTotal = (selectedInvoice.paidAmount || 0) + payVal;
    const newOutstanding = Math.max(0, selectedInvoice.totalAmount - newPaidTotal);
    const newStatus: InvoiceStatus = newOutstanding === 0 ? 'paid' : 'partially_paid';

    const newPaymentRecord = {
      id: generateId(),
      amount: payVal,
      date: new Date().toISOString(),
      method: paymentMethod,
      referenceNumber: paymentRef || undefined,
    };

    await db.invoices.update(selectedInvoice.id!, {
      paidAmount: newPaidTotal,
      outstandingAmount: newOutstanding,
      status: newStatus,
      payments: [...(selectedInvoice.payments || []), newPaymentRecord],
      updatedAt: new Date().toISOString(),
    });

    // Also automatically register as an income transaction in the ledger
    await db.transactions.add({
      id: generateId(),
      title: `Invoice Payment: ${selectedInvoice.invoiceNumber} (${selectedInvoice.clientName})`,
      amount: payVal,
      type: 'income',
      category: 'client_project',
      date: new Date().toISOString(),
      paymentMethod,
      referenceNumber: paymentRef || undefined,
      currency: defaultCurrency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success(`Recorded ${formatCurrency(payVal, defaultCurrency)} and added to ledger`);
    setPaymentModalOpen(false);
    setSelectedInvoice(null);
    setPaymentAmount('');
    setPaymentRef('');
  };

  const handleDownloadPDF = (inv: Invoice) => {
    try {
      const doc = new jsPDF();

      // Header branding
      doc.setFontSize(22);
      doc.setTextColor(23, 63, 117); // #173F75
      doc.text('RHIZAN TECHNOLOGIES', 14, 22);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Addis Ababa, Ethiopia · info@rhizan.com', 14, 28);

      // Invoice info block
      doc.setFontSize(16);
      doc.setTextColor(23, 43, 77);
      doc.text('INVOICE', 140, 22);

      doc.setFontSize(10);
      doc.text(`Invoice No: ${inv.invoiceNumber}`, 140, 28);
      doc.text(`Issue Date: ${formatDate(inv.issueDate, 'short')}`, 140, 34);
      doc.text(`Due Date: ${formatDate(inv.dueDate, 'short')}`, 140, 40);

      // Billed To
      doc.setFontSize(11);
      doc.setTextColor(23, 63, 117);
      doc.text('BILLED TO:', 14, 48);
      doc.setFontSize(10);
      doc.setTextColor(23, 43, 77);
      doc.text(inv.clientName, 14, 54);

      // Status pill
      doc.setFontSize(10);
      doc.setTextColor(inv.status === 'paid' ? 22 : 220, inv.status === 'paid' ? 163 : 38, 38);
      doc.text(`Status: ${inv.status.toUpperCase()}`, 140, 48);

      // Items Table
      const tableRows = inv.items.map((item) => [
        item.description,
        item.quantity.toString(),
        formatCurrency(item.unitPrice, inv.currency),
        formatCurrency(item.total, inv.currency),
      ]);

      autoTable(doc, {
        startY: 64,
        head: [['Item & Description', 'Qty', 'Unit Price', 'Total']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [23, 63, 117], textColor: 255 },
        styles: { fontSize: 9 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;

      // Summary Table / Financials
      doc.setFontSize(10);
      doc.setTextColor(23, 43, 77);
      doc.text(`Total Amount: ${formatCurrency(inv.totalAmount, inv.currency)}`, 130, finalY);
      doc.text(`Amount Paid: ${formatCurrency(inv.paidAmount, inv.currency)}`, 130, finalY + 6);
      doc.setFontSize(11);
      doc.setTextColor(220, 38, 38);
      doc.text(`Balance Due: ${formatCurrency(inv.outstandingAmount, inv.currency)}`, 130, finalY + 14);

      // Payment instructions
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Payment Methods Accepted: Commercial Bank of Ethiopia (CBE), Awash Bank, or telebirr.', 14, finalY + 25);
      doc.text('Thank you for choosing RHIZAN Technologies.', 14, finalY + 30);

      doc.save(`${inv.invoiceNumber}_RHIZAN.pdf`);
      toast.success('Invoice PDF generated');
    } catch (err) {
      console.error(err);
      toast.error('Could not generate PDF');
    }
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
              Client Invoices
            </h1>
            <p className="text-xs text-content-secondary">
              Generate branded invoices and track outstanding customer balances
            </p>
          </div>
        </div>

        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Invoice
        </Button>
      </div>

      {/* Invoice Cards */}
      <div className="grid grid-cols-1 gap-4">
        {invoices.length === 0 ? (
          <Card className="border-border shadow-card py-12 text-center">
            <CardContent>
              <FileText className="h-10 w-10 text-content-tertiary mx-auto mb-2" />
              <p className="text-sm font-semibold text-content-primary">No Invoices Created Yet</p>
              <p className="text-xs text-content-secondary mt-1">
                Generate your first invoice for a prospective or paying client.
              </p>
            </CardContent>
          </Card>
        ) : (
          invoices.map((inv) => (
            <Card key={inv.id} className="border-border shadow-card">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-brand-primary">
                        {inv.invoiceNumber}
                      </span>
                      <Badge
                        variant={
                          inv.status === 'paid'
                            ? 'success'
                            : inv.status === 'partially_paid'
                            ? 'warning'
                            : 'outline'
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {inv.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <h3 className="text-base font-semibold text-content-primary">
                      {inv.clientName}
                    </h3>
                    <p className="text-xs text-content-secondary">
                      Issued: {formatDate(inv.issueDate, 'short')} · Due:{' '}
                      {formatDate(inv.dueDate, 'short')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:text-right">
                    <div>
                      <p className="text-xs text-content-secondary">Total Amount</p>
                      <p className="text-base font-bold text-content-primary">
                        {formatCurrency(inv.totalAmount, defaultCurrency)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-content-secondary">Outstanding</p>
                      <p
                        className={`text-base font-bold ${
                          inv.outstandingAmount > 0 ? 'text-state-danger' : 'text-state-success'
                        }`}
                      >
                        {formatCurrency(inv.outstandingAmount, defaultCurrency)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {inv.outstandingAmount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentAmount(inv.outstandingAmount.toString());
                            setPaymentModalOpen(true);
                          }}
                          className="border-state-success/40 text-state-success hover:bg-state-success-bg"
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" />
                          Pay
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownloadPDF(inv)}
                      >
                        <FileDown className="h-3.5 w-3.5 mr-1" />
                        PDF
                      </Button>

                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setDeleteInvoiceId(inv.id!)}
                        className="text-content-tertiary hover:text-state-danger hover:bg-state-danger-bg h-8 w-8"
                        title="Delete Invoice"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* CREATE INVOICE DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Client Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label required>Invoice Number</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label required>Client / Business Name</Label>
              <Input
                placeholder="e.g. Addis Coffee Export"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label required>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label required>Service Item Description</Label>
              <Input
                placeholder="e.g. Full-stack Web Portal Architecture"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label required>Quantity</Label>
                <Input
                  type="number"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label required>Unit Price ({defaultCurrency})</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Issue Invoice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RECORD PAYMENT DIALOG */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Invoice Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
              <div className="rounded-lg bg-surface-bg p-3 border border-border">
                <p className="text-xs text-content-secondary">
                  Invoice: <span className="font-semibold text-content-primary">{selectedInvoice.invoiceNumber}</span>
                </p>
                <p className="text-xs text-content-secondary">
                  Client: <span className="font-semibold text-content-primary">{selectedInvoice.clientName}</span>
                </p>
                <p className="text-xs text-content-secondary mt-1">
                  Remaining Balance: <span className="font-bold text-state-danger">{formatCurrency(selectedInvoice.outstandingAmount, defaultCurrency)}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label required>Payment Amount ({defaultCurrency})</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
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
                    <SelectItem value="bank_transfer">CBE / Awash Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">telebirr / CBE Birr</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Bank / Transaction Reference</Label>
                <Input
                  placeholder="e.g. CBE-TX-984210"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-state-success hover:bg-green-700">
                  Confirm Payment
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE INVOICE ALERT DIALOG */}
      <AlertDialog open={!!deleteInvoiceId} onOpenChange={() => setDeleteInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? The outstanding receivables calculation will update automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteInvoice} className="bg-state-danger text-white">
              Delete Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
