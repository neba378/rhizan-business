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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { Budget, ExpenseCategory } from '@/lib/types';

const CATEGORIES: { label: string; value: ExpenseCategory }[] = [
  { label: 'Internet & Connectivity', value: 'internet' },
  { label: 'Software Subscriptions', value: 'software_subscriptions' },
  { label: 'Marketing & Ads', value: 'marketing' },
  { label: 'Transportation & Commute', value: 'transportation' },
  { label: 'Office & Workspace', value: 'office_expenses' },
  { label: 'Payroll & Contractors', value: 'employee_payments' },
  { label: 'Infrastructure & Cloud', value: 'infrastructure' },
  { label: 'Other Operating Expenses', value: 'other_expenses' },
];

export function BudgetsPage() {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const budgets = useLiveQuery(() => db.budgets.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.where('type').equals('expense').toArray()) || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('internet');
  const [plannedAmount, setPlannedAmount] = useState('');

  // Calculate actual spending per category from transactions
  const actualsByCategory: Record<string, number> = {};
  transactions.forEach((tx) => {
    actualsByCategory[tx.category] = (actualsByCategory[tx.category] || 0) + tx.amount;
  });

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const planned = parseFloat(plannedAmount);
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
              Active Period: {currentMonth} · Spending thresholds and controls
            </p>
          </div>
        </div>

        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Set Budget
        </Button>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {budgets.map((b) => {
          const actual = actualsByCategory[b.category] || b.actualAmount || 0;
          const percentage = Math.min(100, Math.round((actual / b.plannedAmount) * 100));
          const remaining = b.plannedAmount - actual;
          const isOver = remaining < 0;
          const isWarning = percentage >= 80 && !isOver;

          const categoryLabel =
            CATEGORIES.find((c) => c.value === b.category)?.label || b.category.replace(/_/g, ' ');

          return (
            <Card key={b.id} className="border-border shadow-card">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-content-primary capitalize">
                    {categoryLabel}
                  </h3>
                  <Badge
                    variant={isOver ? 'danger' : isWarning ? 'warning' : 'success'}
                    className="text-[10px] uppercase font-bold"
                  >
                    {isOver ? 'Over Budget' : isWarning ? 'Near Limit' : 'On Track'}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-content-secondary">
                    <span>
                      Spent: <strong className="text-content-primary">{formatCurrency(actual, defaultCurrency)}</strong>
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

      {/* SET BUDGET DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Category Budget</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveBudget} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Expense Category</Label>
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ExpenseCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
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
    </div>
  );
}
