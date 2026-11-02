import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatCurrency, generateId } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { Prospect, PipelineStage } from '@/lib/types';

const STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: 'identified', label: '1. Identified', color: 'border-slate-300' },
  { id: 'researched', label: '2. Researched', color: 'border-blue-300' },
  { id: 'contacted', label: '3. Contacted', color: 'border-indigo-300' },
  { id: 'interested', label: '4. Interested', color: 'border-cyan-300' },
  { id: 'meeting_scheduled', label: '5. Meeting Scheduled', color: 'border-amber-300' },
  { id: 'requirements_gathered', label: '6. Requirements', color: 'border-orange-300' },
  { id: 'proposal_sent', label: '7. Proposal Sent', color: 'border-purple-300' },
  { id: 'negotiation', label: '8. Negotiation', color: 'border-pink-300' },
  { id: 'won', label: '9. Closed Won', color: 'border-green-400' },
  { id: 'lost', label: '10. Lost', color: 'border-red-400' },
];

export function PipelinePage() {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const prospects = useLiveQuery(() => db.prospects.toArray()) || [];

  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [lostReason, setLostReason] = useState('');

  const moveStage = async (prospect: Prospect, direction: 'forward' | 'backward') => {
    const currentIndex = STAGES.findIndex((s) => s.id === prospect.stage);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= STAGES.length) return;

    const nextStage = STAGES[nextIndex].id;

    if (nextStage === 'lost') {
      setSelectedProspectId(prospect.id!);
      setLostModalOpen(true);
      return;
    }

    await db.prospects.update(prospect.id!, {
      stage: nextStage,
      updatedAt: new Date().toISOString(),
    });

    toast.success(`${prospect.businessName} moved to ${STAGES[nextIndex].label}`);
  };

  const confirmLost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProspectId) return;

    await db.prospects.update(selectedProspectId, {
      stage: 'lost',
      lostReason: lostReason || 'Budget or timing mismatch',
      updatedAt: new Date().toISOString(),
    });

    toast.info('Deal marked as lost and reason archived');
    setLostModalOpen(false);
    setSelectedProspectId(null);
    setLostReason('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/clients">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-content-primary">
              Sales Pipeline Kanban
            </h1>
            <p className="text-xs text-content-secondary">
              Scroll horizontally to progress deals through each commercial stage
            </p>
          </div>
        </div>

        <Link to="/clients">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Prospect
          </Button>
        </Link>
      </div>

      {/* Horizontal Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4 scroll-area snap-x snap-mandatory">
        {STAGES.map((col, idx) => {
          const colProspects = prospects.filter((p) => p.stage === col.id);
          const colValue = colProspects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);

          return (
            <div
              key={col.id}
              className="w-[82vw] sm:w-72 shrink-0 flex flex-col rounded-card border border-border bg-surface-bg p-3 snap-start"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold text-content-primary">{col.label}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-content-secondary shadow-sm">
                  {colProspects.length}
                </span>
              </div>

              <div className="py-1 text-[11px] font-medium text-content-secondary">
                Total: <span className="text-brand-primary font-bold">{formatCurrency(colValue, defaultCurrency)}</span>
              </div>

              {/* Cards in column */}
              <div className="flex-1 space-y-2.5 pt-2 min-h-[300px]">
                {colProspects.length === 0 ? (
                  <div className="h-24 rounded-lg border border-dashed border-border flex items-center justify-center text-[11px] text-content-tertiary">
                    No deals here
                  </div>
                ) : (
                  colProspects.map((p) => (
                    <Card
                      key={p.id}
                      className="border-border shadow-card bg-white p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-bold text-content-primary leading-tight">
                          {p.businessName}
                        </h4>
                        <Badge
                          variant={
                            p.priority === 'urgent'
                              ? 'danger'
                              : p.priority === 'high'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-[9px] uppercase font-bold"
                        >
                          {p.priority}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-content-secondary">{p.contactName}</p>

                      <p className="text-xs font-bold text-brand-primary">
                        {formatCurrency(p.estimatedValue, defaultCurrency)}
                      </p>

                      {p.lostReason && (
                        <p className="text-[10px] text-state-danger italic bg-state-danger-bg p-1 rounded">
                          Lost: {p.lostReason}
                        </p>
                      )}

                      {/* Progression controls */}
                      <div className="flex items-center justify-between pt-1 border-t border-border">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={idx === 0}
                          onClick={() => moveStage(p, 'backward')}
                          title="Move stage back"
                          className="h-6 w-6"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>

                        <span className="text-[10px] text-content-tertiary">Move</span>

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={idx === STAGES.length - 1}
                          onClick={() => moveStage(p, 'forward')}
                          title="Advance stage"
                          className="h-6 w-6"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RECORD LOST REASON MODAL */}
      <Dialog open={lostModalOpen} onOpenChange={setLostModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Lost Deal Reason</DialogTitle>
          </DialogHeader>
          <form onSubmit={confirmLost} className="space-y-4 pt-2">
            <p className="text-xs text-content-secondary">
              Recording why a deal was lost helps refine RHIZAN pricing, pitch, and qualification criteria.
            </p>
            <div className="space-y-1.5">
              <Label required>Reason for Loss</Label>
              <Input
                placeholder="e.g. Budget constraints / Selected competitor / Postponed"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLostModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Archive as Lost
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
