import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatDate, generateId } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Video,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  Plus,
  ArrowRight,
  Sparkles,
  CheckSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { ContentItem, ContentPillar, Platform, ContentStatus } from '@/lib/types';

export function MarketingOverviewPage() {
  const content = useLiveQuery(() => db.contentItems.toArray()) || [];
  const performance = useLiveQuery(() => db.contentPerformance.toArray()) || [];
  const [modalOpen, setModalOpen] = useState(false);

  const totalViews = performance.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalInquiries = performance.reduce((sum, p) => sum + (p.businessInquiries || 0), 0);

  // New Content Form State
  const [title, setTitle] = useState('');
  const [pillar, setPillar] = useState<ContentPillar>('ethiopian_business_problems');
  const [platform, setPlatform] = useState<Platform>('tiktok');
  const [topic, setTopic] = useState('');
  const [hook, setHook] = useState('');
  const [script, setScript] = useState('');
  const [status, setStatus] = useState<ContentStatus>('idea');

  const publishedCount = content.filter((c) => c.status === 'published').length;
  const inProductionCount = content.filter(
    (c) => c.status !== 'published' && c.status !== 'idea'
  ).length;

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    await db.contentItems.add({
      id: generateId(),
      title,
      pillar,
      platform,
      topic: topic || 'Business execution',
      hook: hook || undefined,
      script: script || undefined,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success('Content item added to production calendar');
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setTopic('');
    setHook('');
    setScript('');
    setStatus('idea');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
            TikTok & Social Marketing
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary">
            Strategic brand awareness, founder storytelling, and client acquisition
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/marketing/calendar">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-1.5" />
              Content Schedule
            </Button>
          </Link>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Plan Content
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          title="Published Videos"
          value={publishedCount.toString()}
          icon={Video}
          iconBg="bg-state-success-bg"
          iconColor="text-state-success"
        />
        <StatCard
          title="In Production"
          value={inProductionCount.toString()}
          icon={Sparkles}
          iconBg="bg-brand-primary/10"
          iconColor="text-brand-primary"
        />
        <StatCard
          title="Total Views"
          value={totalViews > 0 ? (totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews.toString()) : '0'}
          icon={Eye}
          iconBg="bg-state-info-bg"
          iconColor="text-state-info"
        />
        <StatCard
          title="Inquiries Generated"
          value={totalInquiries.toString()}
          icon={Heart}
          iconBg="bg-state-warning-bg"
          iconColor="text-state-warning"
        />
      </div>

      {/* Content Pillars Strategy Section */}
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">RHIZAN Content Pillars (40 / 25 / 35 Strategy)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-surface-bg p-4 border border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-content-primary">
                  1. Ethiopian Business Problems
                </span>
                <Badge className="bg-brand-primary/10 text-brand-primary font-bold">40%</Badge>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Tackle local inefficiencies: paper invoices, manual inventory, unorganized Telegram orders, delayed CBE transfers.
              </p>
            </div>

            <div className="rounded-lg bg-surface-bg p-4 border border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-content-primary">
                  2. RHIZAN Founder Journey
                </span>
                <Badge className="bg-state-warning-bg text-state-warning font-bold">25%</Badge>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Behind-the-scenes, building a tech company in Addis Ababa, power challenges, hiring, discipline and milestones.
              </p>
            </div>

            <div className="rounded-lg bg-surface-bg p-4 border border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-content-primary">
                  3. Solutions & Product Demos
                </span>
                <Badge className="bg-state-success-bg text-state-success font-bold">35%</Badge>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Live demonstrations of client portals, automated accounting tools, and measurable ROI for local enterprises.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Library & Queue */}
      <Card className="border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Content Pipeline & Scripts</CardTitle>
          <Link to="/marketing/calendar">
            <Button variant="ghost" size="sm" className="text-xs text-brand-primary">
              Calendar View <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {content.map((item) => (
              <div key={item.id} className="py-3.5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {item.platform}
                      </Badge>
                      <h4 className="text-sm font-semibold text-content-primary truncate">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs text-content-secondary">
                      Pillar: <span className="capitalize">{item.pillar.replace(/_/g, ' ')}</span> · Topic: {item.topic}
                    </p>
                  </div>
                  <Badge
                    variant={item.status === 'published' ? 'success' : 'default'}
                    className="text-[10px] uppercase font-bold shrink-0"
                  >
                    {item.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {item.hook && (
                  <div className="rounded bg-surface-bg p-2 text-xs text-content-primary border border-border">
                    <span className="font-semibold text-brand-primary">Hook:</span> "{item.hook}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CREATE CONTENT MODAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Plan Marketing Content</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateContent} className="space-y-3.5 pt-2 max-h-[75vh] overflow-y-auto">
            <div className="space-y-1">
              <Label required>Content Title / Working Concept</Label>
              <Input
                placeholder="e.g. 3 Tools Every Ethiopian SME Needs in 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Strategic Pillar</Label>
                <Select value={pillar} onValueChange={(v) => setPillar(v as ContentPillar)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethiopian_business_problems">Ethiopian Business Problems (40%)</SelectItem>
                    <SelectItem value="founder_journey">RHIZAN Founder Journey (25%)</SelectItem>
                    <SelectItem value="solutions_demos">Solutions & Demos (35%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Primary Platform</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiktok">TikTok (Primary)</SelectItem>
                    <SelectItem value="instagram">Instagram Reels</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="youtube">YouTube Shorts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Video Hook (First 3 Seconds)</Label>
              <Input
                placeholder="e.g. Stop sending PDF invoices manually..."
                value={hook}
                onChange={(e) => setHook(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Script / Outline</Label>
              <Textarea
                placeholder="1. Problem setup&#10;2. Demonstration&#10;3. Call to Action (DM RHIZAN)"
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-1">
              <Label>Production Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="researching">Researching</SelectItem>
                  <SelectItem value="script_writing">Script Writing</SelectItem>
                  <SelectItem value="ready_to_record">Ready to Record</SelectItem>
                  <SelectItem value="recording">Recording</SelectItem>
                  <SelectItem value="editing">Editing</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Schedule Content</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
