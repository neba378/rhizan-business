import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatCurrency, generateId, isToday } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Utensils,
  Coffee,
  Car,
  Wifi,
  ShoppingBag,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ExpensePreset, ExpenseCategory, PaymentMethod, Transaction } from '@/lib/types';

interface QuickExpenseWidgetProps {
  onExpenseAdded?: () => void;
  className?: string;
}

export function QuickExpenseWidget({ onExpenseAdded, className = '' }: QuickExpenseWidgetProps) {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const presets = useLiveQuery(() => db.expensePresets.toArray()) || [];
  const todayTransactions = useLiveQuery(() =>
    db.transactions.filter((t) => t.type === 'expense' && isToday(t.date)).toArray()
  ) || [];

  // Active preset modal state
  const [selectedPreset, setSelectedPreset] = useState<ExpensePreset | null>(null);
  const [additionalAmount, setAdditionalAmount] = useState<string>('');
  const [activeExistingTx, setActiveExistingTx] = useState<Transaction | null>(null);
  const [customPresetAmount, setCustomPresetAmount] = useState<string>('');

  // New Preset Modal state
  const [createPresetOpen, setCreatePresetOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState<ExpenseCategory>('office_expenses');
  const [newPresetAmount, setNewPresetAmount] = useState('150');
  const [newPresetMethod, setNewPresetMethod] = useState<PaymentMethod>('mobile_money');
  const [newPresetDesc, setNewPresetDesc] = useState('');

  // Handle clicking a preset pill
  const handleOpenPreset = (preset: ExpensePreset) => {
    setSelectedPreset(preset);
    setCustomPresetAmount(preset.defaultAmount.toString());
    setAdditionalAmount('');

    // Check if an expense with similar title or preset name was logged today
    const found = todayTransactions.find(
      (t) =>
        t.title.toLowerCase().includes(preset.name.toLowerCase()) ||
        preset.name.toLowerCase().includes(t.title.toLowerCase())
    );

    setActiveExistingTx(found || null);
  };

  // Add onto existing today's transaction
  const handleAddOntoExisting = async (addVal: number) => {
    if (!activeExistingTx) return;
    if (isNaN(addVal) || addVal <= 0) {
      toast.error('Please enter a valid amount to add');
      return;
    }

    const newTotal = activeExistingTx.amount + addVal;
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const addNote = `(+${formatCurrency(addVal, defaultCurrency)} added at ${nowTime})`;
    const updatedDesc = activeExistingTx.description
      ? `${activeExistingTx.description} · ${addNote}`
      : addNote;

    await db.transactions.update(activeExistingTx.id!, {
      amount: newTotal,
      description: updatedDesc,
      updatedAt: new Date().toISOString(),
    });

    toast.success(
      `Added +${formatCurrency(addVal, defaultCurrency)} to today's ${activeExistingTx.title}. New Total: ${formatCurrency(newTotal, defaultCurrency)}`
    );

    setSelectedPreset(null);
    onExpenseAdded?.();
  };

  // Log as new separate expense
  const handleLogNewExpense = async (amountToLog: number) => {
    if (!selectedPreset) return;
    if (isNaN(amountToLog) || amountToLog <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    await db.transactions.add({
      id: generateId(),
      title: selectedPreset.name,
      amount: amountToLog,
      type: 'expense',
      category: selectedPreset.category,
      paymentMethod: selectedPreset.paymentMethod,
      description: selectedPreset.description,
      date: new Date().toISOString(),
      currency: defaultCurrency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success(
      `Recorded expense: ${selectedPreset.name} (${formatCurrency(amountToLog, defaultCurrency)})`
    );

    setSelectedPreset(null);
    onExpenseAdded?.();
  };

  // Save new preset
  const handleSaveNewPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName) {
      toast.error('Please enter preset name');
      return;
    }

    const defaultAmt = parseFloat(newPresetAmount) || 0;

    await db.expensePresets.add({
      id: generateId(),
      name: newPresetName,
      category: newPresetCategory,
      defaultAmount: defaultAmt,
      paymentMethod: newPresetMethod,
      description: newPresetDesc || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success(`Expense preset "${newPresetName}" saved`);
    setCreatePresetOpen(false);
    setNewPresetName('');
    setNewPresetAmount('150');
    setNewPresetDesc('');
  };

  const getPresetIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('injera') || n.includes('lunch') || n.includes('food')) {
      return <Utensils className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
    }
    if (n.includes('buna') || n.includes('coffee') || n.includes('tea')) {
      return <Coffee className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />;
    }
    if (n.includes('taxi') || n.includes('ride') || n.includes('transport')) {
      return <Car className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />;
    }
    if (n.includes('internet') || n.includes('telecom') || n.includes('wifi') || n.includes('data')) {
      return <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
    return <ShoppingBag className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-bold text-content-primary">
            Quick Expense Presets & Add-On Tab
          </span>
          <span className="text-[10px] text-content-secondary hidden sm:inline">
            (Once set, tap to log or add onto today's total)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCreatePresetOpen(true)}
          className="text-xs text-brand-primary h-7 px-2 hover:bg-brand-primary/10"
        >
          <Plus className="h-3 w-3 mr-1" />
          New Preset
        </Button>
      </div>

      {/* Preset Pills Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {presets.map((p) => {
          // Check if recorded today
          const loggedToday = todayTransactions.find(
            (t) =>
              t.title.toLowerCase().includes(p.name.toLowerCase()) ||
              p.name.toLowerCase().includes(t.title.toLowerCase())
          );

          return (
            <button
              key={p.id}
              onClick={() => handleOpenPreset(p)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all shrink-0 shadow-2xs hover:scale-102 active:scale-98 ${
                loggedToday
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
                  : 'bg-surface-card border-border hover:border-brand-primary/40 text-content-primary'
              }`}
            >
              {getPresetIcon(p.name)}
              <span>{p.name}</span>
              <span className="text-[11px] font-bold text-content-secondary">
                {loggedToday
                  ? `Today: ${formatCurrency(loggedToday.amount, defaultCurrency)}`
                  : formatCurrency(p.defaultAmount, defaultCurrency)}
              </span>
              {loggedToday && (
                <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                  +Add
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => setCreatePresetOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border hover:border-brand-primary text-content-secondary hover:text-brand-primary shrink-0 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Custom Preset</span>
        </button>
      </div>

      {/* MODAL: LOG OR ADD ONTO EXPENSE */}
      <Dialog open={!!selectedPreset} onOpenChange={() => setSelectedPreset(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPreset && getPresetIcon(selectedPreset.name)}
              <span>{selectedPreset?.name}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedPreset && (
            <div className="space-y-4 pt-2">
              {/* If already recorded today: Offer to ADD ONTO IT */}
              {activeExistingTx ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-amber-600" />
                        Recorded earlier today:
                      </span>
                      <span className="font-bold text-sm text-amber-900 dark:text-amber-100">
                        {formatCurrency(activeExistingTx.amount, defaultCurrency)}
                      </span>
                    </div>
                    {activeExistingTx.description && (
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300">
                        {activeExistingTx.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Add onto today's {selectedPreset.name}:
                    </Label>

                    {/* Quick increment buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {[50, 100, 150, 200].map((inc) => (
                        <Button
                          key={inc}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAdditionalAmount(inc.toString())}
                          className={`text-xs ${
                            additionalAmount === inc.toString()
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
                        Or enter custom amount to add:
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g. 75"
                        value={additionalAmount}
                        onChange={(e) => setAdditionalAmount(e.target.value)}
                        className="font-medium"
                      />
                    </div>

                    {parseFloat(additionalAmount) > 0 && (
                      <div className="rounded-md bg-surface-bg p-2.5 border border-border text-xs flex items-center justify-between font-semibold">
                        <span className="text-content-secondary">Updated Total:</span>
                        <span className="text-sm font-bold text-state-danger">
                          {formatCurrency(
                            activeExistingTx.amount + (parseFloat(additionalAmount) || 0),
                            defaultCurrency
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      onClick={() => handleAddOntoExisting(parseFloat(additionalAmount))}
                      disabled={!additionalAmount || parseFloat(additionalAmount) <= 0}
                      className="bg-brand-primary hover:bg-brand-secondary text-white w-full"
                    >
                      Add +
                      {formatCurrency(parseFloat(additionalAmount) || 0, defaultCurrency)} onto Today's
                      Total
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleLogNewExpense(
                          parseFloat(additionalAmount) || selectedPreset.defaultAmount
                        )
                      }
                      className="text-xs text-content-secondary hover:text-content-primary"
                    >
                      Or log as a separate new transaction
                    </Button>
                  </div>
                </div>
              ) : (
                /* No expense yet today: Quick log */
                <div className="space-y-3">
                  <p className="text-xs text-content-secondary">
                    No expense recorded for <strong>{selectedPreset.name}</strong> yet today. Set the
                    amount and log it:
                  </p>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      selectedPreset.defaultAmount,
                      selectedPreset.defaultAmount + 50,
                      selectedPreset.defaultAmount + 100,
                      selectedPreset.defaultAmount + 200,
                    ].map((amt) => (
                      <Button
                        key={amt}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomPresetAmount(amt.toString())}
                        className={`text-xs ${
                          customPresetAmount === amt.toString()
                            ? 'border-brand-primary bg-brand-primary/10 font-bold'
                            : ''
                        }`}
                      >
                        {amt} ETB
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Amount ({defaultCurrency})</Label>
                    <Input
                      type="number"
                      value={customPresetAmount}
                      onChange={(e) => setCustomPresetAmount(e.target.value)}
                      className="font-bold text-base"
                    />
                  </div>

                  <div className="rounded-lg bg-surface-bg p-2.5 border border-border text-xs space-y-1">
                    <p className="text-content-secondary">
                      Category: <span className="font-semibold text-content-primary capitalize">{selectedPreset.category.replace(/_/g, ' ')}</span>
                    </p>
                    <p className="text-content-secondary">
                      Method: <span className="font-semibold text-content-primary capitalize">{selectedPreset.paymentMethod.replace(/_/g, ' ')}</span>
                    </p>
                  </div>

                  <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={() => setSelectedPreset(null)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleLogNewExpense(parseFloat(customPresetAmount) || 0)}
                      disabled={!customPresetAmount || parseFloat(customPresetAmount) <= 0}
                    >
                      Record Expense (
                      {formatCurrency(parseFloat(customPresetAmount) || 0, defaultCurrency)})
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE NEW PRESET DIALOG */}
      <Dialog open={createPresetOpen} onOpenChange={setCreatePresetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Recurring Expense Preset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveNewPreset} className="space-y-3.5 pt-2">
            <p className="text-xs text-content-secondary">
              Set an expense once (like "Injera", "Coffee", or "Daily Taxi"). You can then log it or add onto it with one tap.
            </p>

            <div className="space-y-1">
              <Label required>Expense Name</Label>
              <Input
                placeholder="e.g. Injera (Office Lunch), Buna, Ride Taxi"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Default Amount ({defaultCurrency})</Label>
                <Input
                  type="number"
                  placeholder="150"
                  value={newPresetAmount}
                  onChange={(e) => setNewPresetAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Payment Method</Label>
                <Select value={newPresetMethod} onValueChange={(v) => setNewPresetMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile_money">Telebirr / Mobile Money</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">CBE / Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Expense Category</Label>
              <Select value={newPresetCategory} onValueChange={(v) => setNewPresetCategory(v as ExpenseCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office_expenses">Office & Meals (Injera/Coffee)</SelectItem>
                  <SelectItem value="transportation">Transportation & Taxi</SelectItem>
                  <SelectItem value="internet">Internet & Telecom</SelectItem>
                  <SelectItem value="marketing">Marketing & Content</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure & Utilities</SelectItem>
                  <SelectItem value="other_expenses">Other Expenses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Description / Note (Optional)</Label>
              <Input
                placeholder="e.g. Team lunch at local restaurant"
                value={newPresetDesc}
                onChange={(e) => setNewPresetDesc(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreatePresetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Preset</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
