import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatCurrency, generateId } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { Plus, ArrowLeft, AlertTriangle, Trash2, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { Budget, ExpenseCategory } from '@/lib/types';

export function BudgetsPage() {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.where('type').equals('expense').toArray()) || [];
  const customCategories = useLiveQuery(() => db.customCategories.toArray()) || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [plannedAmount, setPlannedAmount] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // New category creation modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#16A34A');

  // Calculate actual spending per category from transactions
  const actualsByCategory: Record<string, number> = {};
  transactions.forEach((tx) => {
    actualsByCategory[tx.category] = (actualsByCategory[tx.category] || 0) + tx.amount;
  });

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const planned = parseFloat(plannedAmount);
    if (!selectedCategory) {
      toast.error('Please select an expense category');
      return;
    }
    if (isNaN(planned) || planned <= 0) {
      toast.error('Please enter a valid planned budget amount');
      return;
    }

    const existing = budgets.find((b) => b.category === selectedCategory && b.month === currentMonth);
    const actual = actualsByCategory[selectedCategory] || 0;

    if (existing) {
      await db.budgets.update(existing.id!, {
        plannedAmount: planned,
        actualAmount: actual,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Budget allocation updated');
    } else {
      await db.budgets.add({
        id: generateId(),
        category: selectedCategory,
        month: currentMonth,
        plannedAmount: planned,
        actualAmount: actual,
        currency: defaultCurrency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'synced',
      });
      toast.success('Budget created');
    }

    setModalOpen(false);
    setPlannedAmount('');
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('Please enter category name');
      return;
    }

    const id = `cat-${Date.now()}`;
    await db.customCategories.add({
      id,
      name: newCatName.trim(),
      color: newCatColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success(`Category "${newCatName.trim()}" created`);
    setSelectedCategory(newCatName.trim());
    setCategoryModalOpen(false);
    setNewCatName('');
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await db.budgets.delete(deleteId);
    toast.success('Budget deleted successfully');
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/finance">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-content-primary">
              Monthly Expense Budgets
            </h1>
            <p className="text-xs text-content-secondary">
              Active Period: {currentMonth} · Spending limits & allocations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCategoryModalOpen(true)}>
            <Tag className="h-4 w-4 mr-1.5 text-brand-primary" />
            New Category
          </Button>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Set Budget
          </Button>
        </div>
      </div>

      {/* Budget Cards Grid */}
      {budgets.length === 0 ? (
        <Card className="border-border shadow-card py-12 text-center">
          <CardContent className="space-y-2">
            <p className="text-sm font-semibold text-content-primary">No budget allocations set yet</p>
            <p className="text-xs text-content-secondary max-w-sm mx-auto">
              Set monthly spending targets for categories like Injera/Meals, Transportation, or Internet to avoid overspending.
            </p>
            <Button size="sm" onClick={() => setModalOpen(true)} className="mt-3">
              <Plus className="h-4 w-4 mr-1.5" /> Set First Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {budgets.map((b) => {
            const actual = actualsByCategory[b.category] || b.actualAmount || 0;
            const percentage = Math.min(100, Math.round((actual / b.plannedAmount) * 100));
            const remaining = b.plannedAmount - actual;
            const isOver = remaining < 0;
            const isWarning = percentage >= 80 && !isOver;

            const categoryMatch = customCategories.find((c) => c.name === b.category || c.id === b.category);
            const categoryLabel = categoryMatch ? categoryMatch.name : b.category.replace(/_/g, ' ');

            return (
              <Card key={b.id} className="border-border shadow-card">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: categoryMatch?.color || '#16A34A' }}
                      />
                      <h3 className="text-sm font-bold text-content-primary capitalize">
                        {categoryLabel}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={isOver ? 'danger' : isWarning ? 'warning' : 'success'}
                        className="text-[10px] uppercase font-bold"
                      >
                        {isOver ? 'Over Budget' : isWarning ? 'Near Limit' : 'On Track'}
                      </Badge>

                      {/* Delete Budget Button */}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteId(b.id!)}
                        className="h-7 w-7 text-content-tertiary hover:text-state-danger hover:bg-state-danger-bg"
                        title="Delete Budget"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-content-secondary">
                      <span>
                        Spent:{' '}
                        <strong className="text-content-primary">
                          {formatCurrency(actual, defaultCurrency)}
                        </strong>
                      </span>
                      <span>
                        Limit: <strong>{formatCurrency(b.plannedAmount, defaultCurrency)}</strong>
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      indicatorClassName={
                        isOver ? 'bg-state-danger' : isWarning ? 'bg-state-warning' : 'bg-brand-primary'
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-content-tertiary">{percentage}% utilized</span>
                    <span
                      className={`font-semibold ${
                        isOver ? 'text-state-danger' : 'text-state-success'
                      }`}
                    >
                      {isOver
                        ? `Exceeded by ${formatCurrency(Math.abs(remaining), defaultCurrency)}`
                        : `${formatCurrency(remaining, defaultCurrency)} remaining`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* SET BUDGET DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Monthly Budget</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveBudget} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Expense Category</Label>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(true)}
                  className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> New Category
                </button>
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose expense category..." />
                </SelectTrigger>
                <SelectContent>
                  {customCategories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color || '#16A34A' }} />
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label required>Monthly Allocation ({defaultCurrency})</Label>
              <Input
                type="number"
                placeholder="5000"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Budget</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE CATEGORY DIALOG */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Expense Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4 pt-2">
            <p className="text-xs text-content-secondary">
              Create a dedicated category (e.g. "Food & Injera", "Staff Transport", "Legal & Permits"). All expenses in this category will be aggregated in your expense charts.
            </p>

            <div className="space-y-1.5">
              <Label required>Category Name</Label>
              <Input
                placeholder="e.g. Food & Team Injera"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category Chart Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="h-9 w-14 rounded border border-border cursor-pointer p-0.5 bg-transparent"
                />
                <span className="text-xs font-mono text-content-secondary">{newCatColor}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget Allocation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this budget? You can recreate it at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-state-danger text-white">
              Delete Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
