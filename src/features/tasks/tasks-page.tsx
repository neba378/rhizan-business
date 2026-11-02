import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { formatDate, generateId } from '@/lib/utils';
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
  CheckSquare,
  Plus,
  Clock,
  Trash2,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Task, Priority, TaskModule, TaskStatus } from '@/lib/types';

export function TasksPage() {
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [module, setModule] = useState<TaskModule>('general');
  const [priority, setPriority] = useState<Priority>('high');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  const filtered = tasks.filter((t) => {
    const matchesModule = filterModule === 'all' || t.module === filterModule;
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
        ? t.status !== 'completed'
        : t.status === 'completed';
    return matchesModule && matchesStatus;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    await db.tasks.add({
      id: generateId(),
      title,
      description: description || undefined,
      module,
      priority,
      status: 'todo',
      dueDate: new Date(dueDate).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    toast.success('Task created');
    setModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    await db.tasks.update(task.id!, {
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });
    toast.success(nextStatus === 'completed' ? 'Task completed' : 'Task marked as todo');
  };

  const deleteTask = async (id: string) => {
    await db.tasks.delete(id);
    toast.success('Task removed');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
            Tasks & Daily Priorities
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary">
            Unified execution across finance, client outreach, marketing, and founder operations
          </p>
        </div>

        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Task
        </Button>
      </div>

      {/* Filter Tabs */}
      <Card className="border-border shadow-card">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-content-secondary mr-2">Filter:</span>
            <Button
              size="sm"
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              className="text-xs h-7 px-2.5"
            >
              All ({tasks.length})
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('active')}
              className="text-xs h-7 px-2.5"
            >
              Pending ({tasks.filter((t) => t.status !== 'completed').length})
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('completed')}
              className="text-xs h-7 px-2.5"
            >
              Completed ({tasks.filter((t) => t.status === 'completed').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card className="border-border shadow-card">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-content-tertiary">
              No tasks found in this view.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <input
                      type="checkbox"
                      checked={t.status === 'completed'}
                      onChange={() => toggleTaskStatus(t)}
                      className="h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary cursor-pointer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-sm font-semibold text-content-primary truncate ${
                          t.status === 'completed' ? 'line-through text-content-tertiary' : ''
                        }`}
                      >
                        {t.title}
                      </span>
                      {t.description && (
                        <span className="text-xs text-content-secondary truncate mt-0.5">
                          {t.description}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider capitalize">
                          {t.module}
                        </Badge>
                        {t.dueDate && (
                          <span className="text-[10px] text-content-tertiary flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(t.dueDate, 'short')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Badge
                      variant={
                        t.priority === 'urgent'
                          ? 'danger'
                          : t.priority === 'high'
                          ? 'warning'
                          : 'secondary'
                      }
                      className="text-[9px] uppercase font-bold"
                    >
                      {t.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteTask(t.id!)}
                      className="text-content-tertiary hover:text-state-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE TASK MODAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label required>Task Title</Label>
              <Input
                placeholder="e.g. Call Dawit regarding revised SLA"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Description / Notes</Label>
              <Input
                placeholder="Optional context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Module</Label>
                <Select value={module} onValueChange={(v) => setModule(v as TaskModule)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="clients">Clients CRM</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="meetings">Meetings</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>

            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
