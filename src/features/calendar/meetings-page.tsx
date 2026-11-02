import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatDate, generateId } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Meeting, MeetingType } from '@/lib/types';

export function MeetingsPage() {
  const meetings = useLiveQuery(() => db.meetings.orderBy('dateTime').toArray()) || [];
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [meetingType, setMeetingType] = useState<MeetingType>('client_discovery');
  const [participants, setParticipants] = useState('RHIZAN Founder, Client');
  const [location, setLocation] = useState('Google Meet / Phone');
  const [agenda, setAgenda] = useState('');

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    await db.meetings.add({
      id: generateId(),
      title,
      dateTime: new Date(dateTime).toISOString(),
      meetingType,
      participants: participants.split(',').map((p) => p.trim()),
      location,
      agenda: agenda || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success('Meeting scheduled in calendar');
    setModalOpen(false);
    setTitle('');
    setAgenda('');
  };

  const deleteMeeting = async (id: string) => {
    await db.meetings.delete(id);
    toast.success('Meeting deleted');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
            Meetings & Calendar
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary">
            Client discovery calls, sales pitches, and strategic review sessions
          </p>
        </div>

        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Schedule Meeting
        </Button>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {meetings.length === 0 ? (
          <Card className="border-border shadow-card py-12 text-center">
            <CardContent>
              <Calendar className="h-10 w-10 text-content-tertiary mx-auto mb-2" />
              <p className="text-sm font-semibold text-content-primary">No Scheduled Meetings</p>
              <p className="text-xs text-content-secondary mt-1">
                Schedule a client call or weekly internal review.
              </p>
            </CardContent>
          </Card>
        ) : (
          meetings.map((m) => (
            <Card key={m.id} className="border-border shadow-card">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold capitalize">
                        {m.meetingType.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-content-secondary flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(m.dateTime).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-content-primary">{m.title}</h3>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteMeeting(m.id!)}
                    className="self-end sm:self-auto text-content-tertiary hover:text-state-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-content-secondary pt-1">
                  {m.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-content-tertiary" />
                      {m.location}
                    </span>
                  )}
                  {m.participants && m.participants.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-content-tertiary" />
                      {m.participants.join(', ')}
                    </span>
                  )}
                </div>

                {m.agenda && (
                  <div className="rounded-md bg-surface-bg p-3 border border-border text-xs text-content-primary">
                    <span className="font-semibold text-content-primary block mb-1">Agenda & Action Items:</span>
                    <pre className="font-sans whitespace-pre-wrap text-content-secondary text-xs">
                      {m.agenda}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* SCHEDULE MEETING DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateMeeting} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label required>Meeting Title</Label>
              <Input
                placeholder="e.g. Discovery Call with Addis Coffee"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label required>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={meetingType} onValueChange={(v) => setMeetingType(v as MeetingType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_discovery">Client Discovery</SelectItem>
                    <SelectItem value="sales_meeting">Sales Pitch</SelectItem>
                    <SelectItem value="marketing_planning">Marketing Planning</SelectItem>
                    <SelectItem value="financial_review">Financial Review</SelectItem>
                    <SelectItem value="internal_founder">Internal Founder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Location / Link</Label>
              <Input
                placeholder="Google Meet, Zoom, or Office Address"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Participants</Label>
              <Input
                placeholder="Comma separated names..."
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Agenda & Key Questions</Label>
              <Textarea
                placeholder="1. Understand requirements...&#10;2. Present RHIZAN solution..."
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add to Calendar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
