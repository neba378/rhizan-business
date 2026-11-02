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
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowRight,
  GitPullRequest,
  CheckCircle,
  Car,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Sparkles,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CRM_STAGES, normalizePipelineStage } from '@/features/clients/pipeline-page';
import { RHIZAN_TEAM, type Prospect, type PipelineStage, type Priority, type LeadSource, type FollowUpType } from '@/lib/types';

export function ProspectsPage() {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const prospects = useLiveQuery(() => db.prospects.toArray()) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [deleteProspectId, setDeleteProspectId] = useState<string | null>(null);

  const confirmDeleteProspect = async () => {
    if (!deleteProspectId) return;
    await db.prospects.delete(deleteProspectId);
    toast.success('Prospect deleted from CRM');
    if (selectedProspect?.id === deleteProspectId) {
      setSelectedProspect(null);
    }
    setDeleteProspectId(null);
  };

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactName, setContactName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('Addis Ababa');
  const [problems, setProblems] = useState('');
  const [solution, setSolution] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [stage, setStage] = useState<PipelineStage>('new_lead');
  const [priority, setPriority] = useState<Priority>('high');
  const [leadSource, setLeadSource] = useState<LeadSource>('cold_outreach');
  const [assignedTo, setAssignedTo] = useState('Neba');
  const [followUpType, setFollowUpType] = useState<FollowUpType>('call');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  const filtered = prospects.filter(
    (p) =>
      p.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactName) {
      toast.error('Please enter business name and contact person');
      return;
    }

    const val = parseFloat(estimatedValue) || 0;

    await db.prospects.add({
      id: generateId(),
      businessName,
      industry: industry || 'Technology & Commerce',
      contactName,
      position: position || undefined,
      phone: phone || undefined,
      email: email || undefined,
      location,
      identifiedProblems: problems || undefined,
      proposedSolution: solution || undefined,
      estimatedValue: val,
      leadSource,
      priority,
      stage,
      assignedTo,
      followUpType: stage === 'followup' ? followUpType : undefined,
      nextFollowUpDate: stage === 'followup' && nextFollowUpDate ? nextFollowUpDate : undefined,
      currency: defaultCurrency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success(`Prospect ${businessName} saved to CRM`);
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setBusinessName('');
    setIndustry('');
    setContactName('');
    setPosition('');
    setPhone('');
    setEmail('');
    setProblems('');
    setSolution('');
    setEstimatedValue('');
    setStage('new_lead');
    setPriority('high');
    setAssignedTo('Neba');
    setFollowUpType('call');
    setNextFollowUpDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              Client Outreach & CRM
            </h1>
            <Badge variant="outline" className="text-brand-primary border-brand-primary/30">
              Neba · Growth
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-content-secondary mt-0.5">
            Identify prospects, plan calls/visits, gather requirements, close deals & hand off to delivery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/clients/pipeline">
            <Button variant="outline" size="sm" className="shadow-xs">
              <GitPullRequest className="h-4 w-4 mr-1.5 text-brand-primary" />
              Kanban Pipeline
            </Button>
          </Link>
          <Button size="sm" onClick={() => setModalOpen(true)} className="shadow-xs">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Prospect
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-border shadow-card">
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-tertiary" />
            <Input
              placeholder="Search prospects by company, contact person, or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Prospect Directory */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((p) => {
          const normStage = normalizePipelineStage(p.stage);
          const stageConfig = CRM_STAGES.find((s) => s.id === normStage);

          return (
            <Card
              key={p.id}
              className="border-border shadow-card hover:shadow-card-hover transition-all cursor-pointer"
              onClick={() => setSelectedProspect(p)}
            >
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-content-primary">{p.businessName}</h3>
                    <p className="text-xs text-content-secondary mt-0.5">
                      {p.industry} · {p.location || 'Addis Ababa'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        p.priority === 'urgent'
                          ? 'danger'
                          : p.priority === 'high'
                          ? 'warning'
                          : 'secondary'
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {p.priority}
                    </Badge>
                    <span className="text-[10px] text-content-tertiary">
                      Lead: <strong className="text-content-secondary">{p.assignedTo || 'Neba'}</strong>
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-content-secondary">
                  <p>
                    Contact: <span className="font-semibold text-content-primary">{p.contactName}</span>
                    {p.position ? ` (${p.position})` : ''}
                  </p>
                  {p.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-content-tertiary" />
                      <span>{p.phone}</span>
                    </p>
                  )}
                  {p.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-content-tertiary" />
                      <span>{p.email}</span>
                    </p>
                  )}
                </div>

                {/* Follow-up Indicator */}
                {normStage === 'followup' && p.nextFollowUpDate && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
                    <div className="flex items-center gap-1.5">
                      {p.followUpType === 'visit' ? (
                        <Car className="h-3.5 w-3.5 text-amber-600" />
                      ) : (
                        <Phone className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      <span className="font-semibold">
                        {p.followUpType === 'visit' ? 'To Go / Visit Scheduled:' : 'To Call Scheduled:'}
                      </span>
                    </div>
                    <span className="font-medium">{formatDate(p.nextFollowUpDate, 'short')}</span>
                  </div>
                )}

                {/* Handed over to Delivery Indicator */}
                {normStage === 'deal' && (
                  <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Handed to Project Lead: {p.projectLead || 'Zizu'}</span>
                    </div>
                    {p.deliveryScheduleDate && (
                      <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400">
                        Kickoff Date: {formatDate(p.deliveryScheduleDate, 'short')}
                      </p>
                    )}
                  </div>
                )}

                {p.identifiedProblems && (
                  <div className="rounded-md bg-surface-bg p-2 text-[11px] text-content-secondary line-clamp-2">
                    <span className="font-semibold text-content-primary">Pain point:</span> {p.identifiedProblems}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <Badge variant="outline" className={`capitalize text-[10px] ${stageConfig?.color || ''}`}>
                    {stageConfig?.label || normStage}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-brand-primary">
                      {formatCurrency(p.estimatedValue, defaultCurrency)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteProspectId(p.id!);
                      }}
                      className="h-6 w-6 text-content-tertiary hover:text-state-danger hover:bg-state-danger-bg"
                      title="Delete Prospect"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* PROSPECT DETAIL MODAL */}
      <Dialog open={!!selectedProspect} onOpenChange={() => setSelectedProspect(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              <span>{selectedProspect?.businessName}</span>
              <Badge variant="outline" className="text-xs">
                {selectedProspect && CRM_STAGES.find((s) => s.id === normalizePipelineStage(selectedProspect.stage))?.label}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedProspect && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-bg p-3 border border-border">
                <div>
                  <span className="text-content-secondary">Estimated Value</span>
                  <p className="text-sm font-bold text-brand-primary">
                    {formatCurrency(selectedProspect.estimatedValue, defaultCurrency)}
                  </p>
                </div>
                <div>
                  <span className="text-content-secondary">Assigned Lead</span>
                  <p className="text-sm font-bold text-content-primary">
                    {selectedProspect.assignedTo || 'Neba'}
                  </p>
                </div>
              </div>

              {/* Follow-up block */}
              {selectedProspect.nextFollowUpDate && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 space-y-1 text-amber-800 dark:text-amber-300">
                  <p className="font-bold flex items-center gap-1.5">
                    {selectedProspect.followUpType === 'visit' ? <Car className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                    Follow-Up Action ({selectedProspect.followUpType === 'visit' ? 'To Go / Visit' : 'To Call'})
                  </p>
                  <p className="text-xs">
                    Target Date: <strong>{formatDate(selectedProspect.nextFollowUpDate, 'long')}</strong>
                  </p>
                </div>
              )}

              {/* Delivery Handover block */}
              {normalizePipelineStage(selectedProspect.stage) === 'deal' && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 space-y-1.5 text-emerald-800 dark:text-emerald-300">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Deal Won & Handed to Operations (Zizu)
                  </p>
                  <p className="text-xs">
                    Project Lead: <strong>{selectedProspect.projectLead || 'Zizu'}</strong>
                  </p>
                  {selectedProspect.deliveryScheduleDate && (
                    <p className="text-xs">
                      Kickoff Scheduled: <strong>{formatDate(selectedProspect.deliveryScheduleDate, 'long')}</strong>
                    </p>
                  )}
                  {selectedProspect.deliveryNotes && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-white/60 dark:bg-black/20 p-2 rounded border border-emerald-500/20">
                      Notes: {selectedProspect.deliveryNotes}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-bold text-content-primary">Contact Information</h4>
                <p>Name: <span className="font-medium">{selectedProspect.contactName}</span></p>
                {selectedProspect.position && <p>Title: {selectedProspect.position}</p>}
                {selectedProspect.phone && <p>Phone: {selectedProspect.phone}</p>}
                {selectedProspect.email && <p>Email: {selectedProspect.email}</p>}
                {selectedProspect.location && <p>Location: {selectedProspect.location}</p>}
              </div>

              {selectedProspect.identifiedProblems && (
                <div className="space-y-1">
                  <h4 className="font-bold text-content-primary">Identified Client Challenges</h4>
                  <p className="text-content-secondary leading-relaxed bg-surface-bg p-2.5 rounded-md border border-border">
                    {selectedProspect.identifiedProblems}
                  </p>
                </div>
              )}

              {selectedProspect.proposedSolution && (
                <div className="space-y-1">
                  <h4 className="font-bold text-content-primary">Proposed RHIZAN Solution</h4>
                  <p className="text-content-secondary leading-relaxed bg-surface-bg p-2.5 rounded-md border border-border">
                    {selectedProspect.proposedSolution}
                  </p>
                </div>
              )}

              <DialogFooter className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteProspectId(selectedProspect.id!)}
                  className="text-state-danger border-state-danger/30 hover:bg-state-danger-bg"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Prospect
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setSelectedProspect(null)}>
                    Close
                  </Button>
                  <Link to="/clients/pipeline">
                    <Button onClick={() => setSelectedProspect(null)}>
                      Open in Kanban Pipeline
                    </Button>
                  </Link>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE PROSPECT DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Prospect to CRM</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProspect} className="space-y-3.5 pt-2 max-h-[75vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label required>Business / Company Name</Label>
              <Input
                placeholder="e.g. Awash Wine SC"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Industry</Label>
                <Input
                  placeholder="e.g. FMCG"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label required>Key Contact Person</Label>
                <Input
                  placeholder="Contact Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Position</Label>
                <Input
                  placeholder="e.g. General Manager"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Phone Number</Label>
                <Input
                  placeholder="+251 9..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="client@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Identified Problems / Pain Points</Label>
              <Input
                placeholder="What bottleneck is costing them money?"
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Proposed RHIZAN Solution</Label>
              <Input
                placeholder="How does RHIZAN solve this?"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label>Estimated Value ({defaultCurrency})</Label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
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
              <div className="space-y-1">
                <Label>Stage</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as PipelineStage)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_STAGES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Follow-up options if stage is followup */}
            {stage === 'followup' && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2.5">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Follow-Up Details (To Call vs To Go)
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label>Follow-Up Type</Label>
                    <Select value={followUpType} onValueChange={(v) => setFollowUpType(v as FollowUpType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">📞 To Call (Phone / Zoom)</SelectItem>
                        <SelectItem value="visit">🚗 To Go (On-site Visit)</SelectItem>
                        <SelectItem value="messaging">💬 Messaging (Telegram / WhatsApp)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Follow-Up Date</Label>
                    <Input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label>Assigned Growth Lead</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RHIZAN_TEAM.map((member) => (
                      <SelectItem key={member.name} value={member.name}>
                        {member.name} ({member.division})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Lead Source</Label>
                <Select value={leadSource} onValueChange={(v) => setLeadSource(v as LeadSource)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                    <SelectItem value="referral">Personal Referral</SelectItem>
                    <SelectItem value="tiktok">TikTok / Social Media</SelectItem>
                    <SelectItem value="website">Website / Inbound</SelectItem>
                    <SelectItem value="event">Industry Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Prospect</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* DELETE CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={!!deleteProspectId} onOpenChange={() => setDeleteProspectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client Prospect?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this prospect from the CRM pipeline? This action cannot be undone.
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
