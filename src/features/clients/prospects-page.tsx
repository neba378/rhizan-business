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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { Prospect, PipelineStage, Priority, LeadSource } from '@/lib/types';

export function ProspectsPage() {
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const prospects = useLiveQuery(() => db.prospects.toArray()) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

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
  const [stage, setStage] = useState<PipelineStage>('identified');
  const [priority, setPriority] = useState<Priority>('high');
  const [leadSource, setLeadSource] = useState<LeadSource>('cold_outreach');

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
    setStage('identified');
    setPriority('high');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
            Client Outreach & CRM
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary">
            Manage potential clients, track outreach activities, and drive deal flow
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/clients/pipeline">
            <Button variant="outline" size="sm">
              <GitPullRequest className="h-4 w-4 mr-1.5" />
              Kanban Pipeline
            </Button>
          </Link>
          <Button size="sm" onClick={() => setModalOpen(true)}>
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
        {filtered.map((p) => (
          <Card
            key={p.id}
            className="border-border shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
            onClick={() => setSelectedProspect(p)}
          >
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-content-primary">{p.businessName}</h3>
                  <p className="text-xs text-content-secondary mt-0.5">
                    {p.industry} · {p.location || 'Addis Ababa'}
                  </p>
                </div>
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

              {p.identifiedProblems && (
                <div className="rounded-md bg-surface-bg p-2 text-[11px] text-content-secondary line-clamp-2">
                  <span className="font-semibold text-content-primary">Pain point:</span> {p.identifiedProblems}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                <Badge variant="outline" className="capitalize text-[10px]">
                  {p.stage.replace('_', ' ')}
                </Badge>
                <span className="font-bold text-sm text-brand-primary">
                  {formatCurrency(p.estimatedValue, defaultCurrency)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PROSPECT DETAIL MODAL */}
      <Dialog open={!!selectedProspect} onOpenChange={() => setSelectedProspect(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProspect?.businessName}</DialogTitle>
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
                  <span className="text-content-secondary">Current Stage</span>
                  <p className="text-sm font-bold capitalize">
                    {selectedProspect.stage.replace('_', ' ')}
                  </p>
                </div>
              </div>

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

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedProspect(null)}>
                  Close
                </Button>
                <Link to="/clients/pipeline">
                  <Button onClick={() => setSelectedProspect(null)}>
                    Open in Pipeline
                  </Button>
                </Link>
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
          <form onSubmit={handleSaveProspect} className="space-y-3.5 pt-2 max-h-[75vh] overflow-y-auto">
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
              <Label>Identified Problems</Label>
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
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="researched">Researched</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="meeting_scheduled">Meeting</SelectItem>
                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
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
    </div>
  );
}
