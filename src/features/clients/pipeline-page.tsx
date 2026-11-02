import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatCurrency, formatDate, generateId } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Phone,
  Car,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  Clock,
  UserCheck,
  FileText,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { Prospect, PipelineStage, FollowUpType } from '@/lib/types';
import { RHIZAN_TEAM } from '@/lib/types';

export const CRM_STAGES: { id: PipelineStage; label: string; icon: string; description: string; color: string }[] = [
  {
    id: 'new_lead',
    label: '1. New Leads & Research',
    icon: '🔍',
    description: 'Initial prospective clients identified by Neba',
    color: 'border-blue-200 bg-blue-50/30',
  },
  {
    id: 'followup',
    label: '2. Follow-Up (Call / To Go)',
    icon: '📞',
    description: 'Scheduled phone calls or in-person visits',
    color: 'border-amber-200 bg-amber-50/30',
  },
  {
    id: 'requirement',
    label: '3. Requirement Stage',
    icon: '📋',
    description: 'Scoping client needs, technical pain points & specs',
    color: 'border-indigo-200 bg-indigo-50/30',
  },
  {
    id: 'proposal',
    label: '4. Proposal & Quotation',
    icon: '💼',
    description: 'Official quote, SLA, and pricing presented',
    color: 'border-purple-200 bg-purple-50/30',
  },
  {
    id: 'deal',
    label: '5. Deal (Handed to Delivery)',
    icon: '🤝',
    description: 'Deal closed! Project Lead (Zizu) schedules kickoff',
    color: 'border-emerald-300 bg-emerald-50/40',
  },
  {
    id: 'rejected',
    label: '6. Rejected / Archived',
    icon: '❌',
    description: 'Not interested / timing issue with reason',
    color: 'border-rose-200 bg-rose-50/30',
  },
];

export function normalizePipelineStage(stage: string): PipelineStage {
  if (stage === 'rejected' || stage === 'lost') return 'rejected';
  if (stage === 'deal' || stage === 'won') return 'deal';
  if (stage === 'requirement' || stage === 'requirements_gathered') return 'requirement';
  if (stage === 'proposal' || stage === 'proposal_sent' || stage === 'negotiation') return 'proposal';
  if (stage === 'followup' || stage === 'contacted' || stage === 'interested' || stage === 'meeting_scheduled') return 'followup';
  return 'new_lead';
}

export function PipelinePage() {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const prospects = useLiveQuery(() => db.prospects.toArray()) || [];

  // Dialog states
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [dealHandoverModalOpen, setDealHandoverModalOpen] = useState(false);
  const [followupModalOpen, setFollowupModalOpen] = useState(false);

  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [deleteProspectId, setDeleteProspectId] = useState<string | null>(null);

  const confirmDeleteProspect = async () => {
    if (!deleteProspectId) return;
    await db.prospects.delete(deleteProspectId);
    toast.success('Prospect deleted from CRM');
    setDeleteProspectId(null);
  };

  // Form states
  const [lostReason, setLostReason] = useState('');
  const [projectLead, setProjectLead] = useState('Zizu (Operations & Delivery)');
  const [kickoffDate, setKickoffDate] = useState(new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [followUpType, setFollowUpType] = useState<FollowUpType>('call');
  const [followUpDate, setFollowUpDate] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16));

  const moveStage = async (prospect: Prospect, direction: 'forward' | 'backward') => {
    const canonicalStage = normalizePipelineStage(prospect.stage);
    const currentIndex = CRM_STAGES.findIndex((s) => s.id === canonicalStage);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= CRM_STAGES.length) return;

    const nextStage = CRM_STAGES[nextIndex].id;

    if (nextStage === 'rejected') {
      setSelectedProspect(prospect);
      setLostModalOpen(true);
      return;
    }

    if (nextStage === 'deal') {
      setSelectedProspect(prospect);
      setDeliveryNotes(prospect.proposedSolution ? `Requirements from Neba: ${prospect.proposedSolution}` : '');
      setDealHandoverModalOpen(true);
      return;
    }

    if (nextStage === 'followup') {
      setSelectedProspect(prospect);
      setFollowupModalOpen(true);
      return;
    }

    await db.prospects.update(prospect.id!, {
      stage: nextStage,
      updatedAt: new Date().toISOString(),
    });

    toast.success(`${prospect.businessName} moved to ${CRM_STAGES[nextIndex].label}`);
  };

  const confirmFollowUpSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProspect) return;

    await db.prospects.update(selectedProspect.id!, {
      stage: 'followup',
      followUpType,
      nextFollowUpDate: new Date(followUpDate).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Also schedule follow-up task
    await db.tasks.add({
      id: generateId(),
      title: `${followUpType === 'call' ? '📞 Call' : '🏢 In-Person Visit'}: ${selectedProspect.businessName} (${selectedProspect.contactName})`,
      description: `Follow-up touchpoint scheduled by Neba (Business Growth)`,
      module: 'clients',
      priority: 'high',
      status: 'todo',
      dueDate: new Date(followUpDate).toISOString(),
      relatedEntityId: selectedProspect.id,
      relatedEntityType: 'prospect',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success(`Follow-up scheduled (${followUpType === 'call' ? 'To Call' : 'To Go / Visit'})`);
    setFollowupModalOpen(false);
    setSelectedProspect(null);
  };

  const confirmDealHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProspect) return;

    await db.prospects.update(selectedProspect.id!, {
      stage: 'deal',
      projectLead: 'Zizu',
      deliveryScheduleDate: new Date(kickoffDate).toISOString(),
      deliveryNotes,
      deliveryStatus: 'pending_kickoff',
      updatedAt: new Date().toISOString(),
    });

    // Automatically trigger delivery planning task for Zizu
    await db.tasks.add({
      id: generateId(),
      title: `[Project Kickoff] Schedule & scope delivery for ${selectedProspect.businessName}`,
      description: `Deal closed by Neba (Growth). Project Lead: Zizu (Operations & Delivery Management). Notes: ${deliveryNotes || 'Coordinate project timeline, deliverables, and test criteria.'}`,
      module: 'clients',
      priority: 'urgent',
      status: 'todo',
      dueDate: new Date(kickoffDate).toISOString(),
      relatedEntityId: selectedProspect.id,
      relatedEntityType: 'prospect',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success(`Deal Won! Handed off to Zizu (Project Lead) for delivery scheduling.`);
    setDealHandoverModalOpen(false);
    setSelectedProspect(null);
  };

  const confirmLost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProspect) return;

    await db.prospects.update(selectedProspect.id!, {
      stage: 'rejected',
      lostReason: lostReason || 'Client timing or budget mismatch',
      updatedAt: new Date().toISOString(),
    });

    toast.info('Prospect moved to Rejected / Archived');
    setLostModalOpen(false);
    setSelectedProspect(null);
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-content-primary">
                Commercial Pipeline Kanban
              </h1>
              <Badge variant="outline" className="text-[10px] font-semibold text-brand-primary border-brand-primary/20">
                Neba → Zizu Handover
              </Badge>
            </div>
            <p className="text-xs text-content-secondary">
              Research → Follow-Up (Call/Visit) → Requirement → Proposal → Deal Delivery
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
        {CRM_STAGES.map((col, idx) => {
          const colProspects = prospects.filter((p) => normalizePipelineStage(p.stage) === col.id);
          const colValue = colProspects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);

          return (
            <div
              key={col.id}
              className={`w-[85vw] sm:w-80 shrink-0 flex flex-col rounded-card border ${col.color} p-3 snap-start shadow-card transition-all`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{col.icon}</span>
                  <span className="text-xs font-bold text-content-primary">{col.label}</span>
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-content-primary shadow-sm border border-border">
                  {colProspects.length}
                </span>
              </div>

              <div className="py-1.5 flex items-center justify-between text-[11px] font-medium text-content-secondary">
                <span>Value:</span>
                <span className="text-brand-primary font-bold">{formatCurrency(colValue, defaultCurrency)}</span>
              </div>

              {/* Cards in column */}
              <div className="flex-1 space-y-2.5 pt-1 min-h-[340px]">
                {colProspects.length === 0 ? (
                  <div className="h-28 rounded-lg border border-dashed border-border bg-white/50 flex flex-col items-center justify-center text-center p-3 text-[11px] text-content-tertiary">
                    <span>No prospects in this stage</span>
                    <span className="text-[10px] mt-0.5 opacity-75">{col.description}</span>
                  </div>
                ) : (
                  colProspects.map((p) => {
                    const isFollowUpDue = p.nextFollowUpDate && new Date(p.nextFollowUpDate) <= new Date();

                    return (
                      <Card
                        key={p.id}
                        className="border-border shadow-card bg-white p-3 space-y-2 hover:shadow-card-hover transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-1.5">
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
                            className="text-[9px] uppercase font-bold shrink-0"
                          >
                            {p.priority}
                          </Badge>
                        </div>

                        <p className="text-[11px] text-content-secondary">
                          {p.contactName} {p.position ? `· ${p.position}` : ''}
                        </p>

                        {/* Follow-up Indicator Badge */}
                        {p.nextFollowUpDate && (
                          <div
                            className={`rounded-md px-2 py-1 flex items-center justify-between text-[10px] font-medium border ${
                              isFollowUpDue
                                ? 'bg-state-warning-bg text-state-warning border-state-warning/30'
                                : 'bg-surface-bg text-content-secondary border-border'
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              {p.followUpType === 'visit' ? (
                                <>
                                  <Car className="h-3 w-3 text-brand-primary" />
                                  <span>To Go / Visit:</span>
                                </>
                              ) : (
                                <>
                                  <Phone className="h-3 w-3 text-state-success" />
                                  <span>To Call:</span>
                                </>
                              )}
                            </span>
                            <span className="font-semibold">{formatDate(p.nextFollowUpDate, 'short')}</span>
                          </div>
                        )}

                        {/* Handover state for won deals */}
                        {normalizePipelineStage(p.stage) === 'deal' && (
                          <div className="rounded-md bg-state-success-bg p-2 border border-state-success/20 text-[10px] space-y-0.5">
                            <div className="flex items-center gap-1 text-state-success font-bold">
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Project Lead: Zizu</span>
                            </div>
                            <p className="text-content-secondary truncate">
                              Status: Delivery schedule & planning
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-bold text-brand-primary">
                            {formatCurrency(p.estimatedValue, defaultCurrency)}
                          </span>

                          {p.location && (
                            <span className="text-[10px] text-content-tertiary truncate max-w-[120px]">
                              📍 {p.location}
                            </span>
                          )}
                        </div>

                        {p.lostReason && (
                          <p className="text-[10px] text-state-danger italic bg-state-danger-bg p-1.5 rounded border border-state-danger/20">
                            Reason: {p.lostReason}
                          </p>
                        )}

                        {/* Stage Controls */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-border">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={idx === 0}
                            onClick={() => moveStage(p, 'backward')}
                            title="Move stage back"
                            className="h-7 w-7 text-content-secondary hover:text-content-primary"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteProspectId(p.id!)}
                            className="h-7 w-7 text-content-tertiary hover:text-state-danger hover:bg-state-danger-bg"
                            title="Delete Prospect"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={idx === CRM_STAGES.length - 1}
                            onClick={() => moveStage(p, 'forward')}
                            title="Advance stage"
                            className="h-7 w-7 text-content-secondary hover:text-content-primary"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SCHEDULE FOLLOW-UP (CALL / VISIT) DIALOG */}
      <Dialog open={followupModalOpen} onOpenChange={setFollowupModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-state-success" />
              <span>Schedule Next Follow-Up</span>
            </DialogTitle>
          </DialogHeader>
          {selectedProspect && (
            <form onSubmit={confirmFollowUpSchedule} className="space-y-4 pt-2">
              <div className="rounded-lg bg-surface-bg p-3 border border-border">
                <p className="text-xs text-content-secondary">
                  Prospect: <strong className="text-content-primary">{selectedProspect.businessName}</strong>
                </p>
                <p className="text-xs text-content-secondary">
                  Contact: <strong className="text-content-primary">{selectedProspect.contactName}</strong>
                  {selectedProspect.phone ? ` (${selectedProspect.phone})` : ''}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label required>Follow-Up Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={followUpType === 'call' ? 'default' : 'outline'}
                    onClick={() => setFollowUpType('call')}
                    className="text-xs"
                  >
                    <Phone className="h-3.5 w-3.5 mr-1" />
                    To Call (Phone)
                  </Button>
                  <Button
                    type="button"
                    variant={followUpType === 'visit' ? 'default' : 'outline'}
                    onClick={() => setFollowUpType('visit')}
                    className="text-xs"
                  >
                    <Car className="h-3.5 w-3.5 mr-1" />
                    To Go (In-Person Visit)
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label required>Scheduled Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFollowupModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Follow-Up
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DEAL WON & HANDOVER TO PROJECT LEAD (ZIZU) DIALOG */}
      <Dialog open={dealHandoverModalOpen} onOpenChange={setDealHandoverModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-state-success">
              <Sparkles className="h-5 w-5" />
              <span>Deal Won — Handover to Delivery</span>
            </DialogTitle>
          </DialogHeader>
          {selectedProspect && (
            <form onSubmit={confirmDealHandover} className="space-y-4 pt-2">
              <div className="rounded-lg bg-emerald-50/60 p-3 border border-emerald-200 space-y-1 text-xs">
                <p className="font-bold text-emerald-900">
                  Congratulations Neba! Commercial deal secured.
                </p>
                <p className="text-emerald-800">
                  Value: <strong>{formatCurrency(selectedProspect.estimatedValue, defaultCurrency)}</strong> · {selectedProspect.businessName}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Assigned Project Delivery Lead</Label>
                <Input value={projectLead} disabled className="bg-surface-bg font-semibold text-content-primary" />
                <span className="text-[11px] text-content-secondary">
                  Zizu coordinates timelines, deliverables, development, and testing.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label required>Target Kickoff / Delivery Start Date</Label>
                <Input
                  type="date"
                  value={kickoffDate}
                  onChange={(e) => setKickoffDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Handoff Notes & Requirements for Zizu</Label>
                <Textarea
                  placeholder="Outline agreed client deliverables, tech stack, key contacts, or milestone expectations..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDealHandoverModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-state-success hover:bg-emerald-700">
                  Hand Off to Delivery
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* RECORD REJECTED / LOST REASON MODAL */}
      <Dialog open={lostModalOpen} onOpenChange={setLostModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-state-danger flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              <span>Move to Rejected / Lost</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={confirmLost} className="space-y-4 pt-2">
            <p className="text-xs text-content-secondary">
              Recording why a lead was rejected or lost helps Neba refine RHIZAN pricing, target customer qualification, and outreach scripts.
            </p>
            <div className="space-y-1.5">
              <Label required>Reason for Rejection / Loss</Label>
              <Input
                placeholder="e.g. Budget constraints / Selected internal solution / Postponed to next quarter"
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
                Archive as Rejected
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* DELETE CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={!!deleteProspectId} onOpenChange={() => setDeleteProspectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client Opportunity?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prospect card from the pipeline?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProspect} className="bg-state-danger text-white">
              Delete Prospect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
