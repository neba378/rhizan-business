import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatDate, generateId } from '@/lib/utils';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Video,
  Eye,
  Heart,
  Share2,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { ContentItem, ContentStatus } from '@/lib/types';

const STATUS_STEPS: { id: ContentStatus; label: string }[] = [
  { id: 'idea', label: 'Idea' },
  { id: 'script_writing', label: 'Scripting' },
  { id: 'ready_to_record', label: 'Ready to Record' },
  { id: 'recording', label: 'Recording' },
  { id: 'editing', label: 'Editing' },
  { id: 'review', label: 'Review' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'published', label: 'Published' },
];

export function ContentCalendarPage() {
  const content = useLiveQuery(() => db.contentItems.toArray()) || [];
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);

  // Performance Form State
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [inquiries, setInquiries] = useState('');

  const updateStatus = async (item: ContentItem, newStatus: ContentStatus) => {
    await db.contentItems.update(item.id!, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
      publishingDate: newStatus === 'published' ? new Date().toISOString() : item.publishingDate,
    });
    toast.success(`Updated status to ${newStatus.replace(/_/g, ' ')}`);
  };

  const handleSaveAnalytics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    await db.contentPerformance.add({
      id: generateId(),
      contentId: selectedItem.id!,
      platform: selectedItem.platform,
      views: parseInt(views) || 0,
      likes: parseInt(likes) || 0,
      comments: parseInt(comments) || 0,
      shares: parseInt(shares) || 0,
      saves: 0,
      followersGained: 0,
      profileVisits: 0,
      businessInquiries: parseInt(inquiries) || 0,
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success('Performance analytics saved for this post');
    setAnalyticsModalOpen(false);
    setViews('');
    setLikes('');
    setComments('');
    setShares('');
    setInquiries('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/marketing">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-content-primary">
              Content Schedule & Pipeline
            </h1>
            <p className="text-xs text-content-secondary">
              Track video creation stages from initial script to TikTok publication
            </p>
          </div>
        </div>

        <Link to="/marketing">
          <Button size="sm">New Content</Button>
        </Link>
      </div>

      {/* Production Stage Columns / List */}
      <div className="space-y-3">
        {content.map((item) => (
          <Card key={item.id} className="border-border shadow-card">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">
                      {item.platform}
                    </Badge>
                    <Badge
                      variant={item.status === 'published' ? 'success' : 'default'}
                      className="text-[10px] uppercase font-bold"
                    >
                      {item.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-content-primary">
                    {item.title}
                  </h3>
                  <p className="text-xs text-content-secondary capitalize">
                    {item.pillar.replace(/_/g, ' ')} · {item.topic}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Select
                    value={item.status}
                    onValueChange={(val) => updateStatus(item, val as ContentStatus)}
                  >
                    <SelectTrigger className="h-8 text-xs w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_STEPS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {item.status === 'published' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedItem(item);
                        setAnalyticsModalOpen(true);
                      }}
                      className="text-xs"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Log Stats
                    </Button>
                  )}
                </div>
              </div>

              {item.hook && (
                <div className="rounded-md bg-surface-bg p-2 text-xs text-content-primary border border-border">
                  <span className="font-semibold text-brand-primary">Hook:</span> "{item.hook}"
                </div>
              )}

              {item.script && (
                <div className="text-xs text-content-secondary">
                  <span className="font-semibold text-content-primary">Script notes:</span>{' '}
                  {item.script}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* LOG PERFORMANCE DIALOG */}
      <Dialog open={analyticsModalOpen} onOpenChange={setAnalyticsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Post Performance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAnalytics} className="space-y-3.5 pt-2">
            <p className="text-xs text-content-secondary">
              Record real post metrics from the TikTok analytics screen to measure engagement.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label required>Total Views</Label>
                <Input
                  type="number"
                  placeholder="12500"
                  value={views}
                  onChange={(e) => setViews(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Likes</Label>
                <Input
                  type="number"
                  placeholder="850"
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Comments</Label>
                <Input
                  type="number"
                  placeholder="42"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Shares</Label>
                <Input
                  type="number"
                  placeholder="65"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Client Inquiries Generated</Label>
              <Input
                type="number"
                placeholder="3"
                value={inquiries}
                onChange={(e) => setInquiries(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAnalyticsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Metrics</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
