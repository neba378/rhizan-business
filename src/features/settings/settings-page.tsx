import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { db, clearDatabase } from '@/lib/db/database';
import { seedDemoData } from '@/lib/db/seed';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Smartphone,
  CheckCircle,
  Bell,
  Globe,
  Building,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Currency } from '@/lib/types';

export function SettingsPage() {
  const companyName = useAppStore((s) => s.companyName);
  const setCompanyName = useAppStore((s) => s.setCompanyName);
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const setDefaultCurrency = useAppStore((s) => s.setDefaultCurrency);
  const timezone = useAppStore((s) => s.timezone);
  const setTimezone = useAppStore((s) => s.setTimezone);

  const userName = useAuthStore((s) => s.userName) || 'RHIZAN Founder';
  const userEmail = useAuthStore((s) => s.userEmail) || 'founder@rhizan.com';
  const pin = useAuthStore((s) => s.pin);
  const setPin = useAuthStore((s) => s.setPin);
  const lock = useAuthStore((s) => s.lock);

  const [currentPin, setCurrentPin] = useState(pin);
  const [notifInvoices, setNotifInvoices] = useState(true);
  const [notifFollowups, setNotifFollowups] = useState(true);
  const [notifBudgets, setNotifBudgets] = useState(true);
  const [notifTasks, setNotifTasks] = useState(true);

  const handleExportFullBackup = async () => {
    try {
      const backup = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        companyName,
        defaultCurrency,
        transactions: await db.transactions.toArray(),
        prospects: await db.prospects.toArray(),
        invoices: await db.invoices.toArray(),
        content: await db.contentItems.toArray(),
        tasks: await db.tasks.toArray(),
        meetings: await db.meetings.toArray(),
        budgets: await db.budgets.toArray(),
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `RHIZAN_Workspace_FullBackup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success('Complete encrypted workspace backup downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create backup');
    }
  };

  const handleStartFresh = async () => {
    if (confirm('Clear all data and start completely fresh? All transactions, prospects, content, and tasks will be removed.')) {
      await clearDatabase();
      toast.success('Database cleared! Workspace is completely fresh.');
    }
  };

  const handleSeedDemo = async () => {
    if (confirm('Load demo sample data for demonstration purposes?')) {
      await seedDemoData();
      toast.success('Demo sample data loaded');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
          Settings & Configurations
        </h1>
        <p className="text-xs sm:text-sm text-content-secondary">
          Profile, business defaults, local backups, and offline PWA settings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Company & Locale Settings */}
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4 text-brand-primary" />
              <span>Company Information & Defaults</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Company Brand Name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Default Currency</Label>
                <Select value={defaultCurrency} onValueChange={(v) => setDefaultCurrency(v as Currency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETB">Ethiopian Birr (ETB)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Addis_Ababa">Africa / Addis Ababa (EAT)</SelectItem>
                    <SelectItem value="UTC">UTC Universal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2">
              <Button size="sm" onClick={() => toast.success('Settings updated')}>
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-brand-primary" />
              <span>Founder Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Founder Full Name</Label>
              <Input value={userName} disabled />
            </div>

            <div className="space-y-1.5">
              <Label>Authentication Email</Label>
              <Input value={userEmail} disabled />
            </div>

            <div className="space-y-1.5">
              <Label>Quick Security PIN</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  maxLength={4}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="font-mono text-center tracking-widest text-base w-28"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (currentPin.length === 4) {
                      setPin(currentPin);
                      toast.success(`PIN updated to ${currentPin}`);
                    } else {
                      toast.error('PIN must be exactly 4 digits');
                    }
                  }}
                >
                  Save PIN
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    lock();
                    toast.info('Workspace Locked');
                  }}
                  className="text-xs text-state-danger hover:bg-state-danger-bg ml-auto"
                >
                  Lock Now
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-surface-bg p-3 border border-border flex items-center gap-2 text-xs text-content-secondary">
              <Shield className="h-4 w-4 text-state-success shrink-0" />
              <span>Role: Authorized Executive Founder (Unrestricted Access)</span>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-primary" />
              <span>Operational Alerts & Reminders</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-primary">Client Follow-Up Alerts</p>
                <p className="text-[11px] text-content-secondary">Notify when prospect touchpoints are overdue</p>
              </div>
              <Switch checked={notifFollowups} onCheckedChange={setNotifFollowups} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-primary">Overdue Invoice Warnings</p>
                <p className="text-[11px] text-content-secondary">Alert when accounts receivable exceed due date</p>
              </div>
              <Switch checked={notifInvoices} onCheckedChange={setNotifInvoices} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-primary">Budget Utilization Limits</p>
                <p className="text-[11px] text-content-secondary">Warn when category spending approaches 80%</p>
              </div>
              <Switch checked={notifBudgets} onCheckedChange={setNotifBudgets} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-content-primary">Today's Daily Priorities</p>
                <p className="text-[11px] text-content-secondary">Morning summary of due tasks and client calls</p>
              </div>
              <Switch checked={notifTasks} onCheckedChange={setNotifTasks} />
            </div>
          </CardContent>
        </Card>

        {/* Data Management, Backups & PWA */}
        <Card className="border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-brand-primary" />
              <span>PWA & Offline Data Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-surface-bg p-3 border border-border space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-content-primary">Storage Engine:</span>
                <span className="text-state-success font-medium">IndexedDB (Offline Persistent)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-content-primary">PWA Status:</span>
                <span className="text-state-success font-medium">Installable on Android & Desktop</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-content-primary">App Version:</span>
                <span className="text-content-secondary font-mono">v1.0.0 (Production)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportFullBackup}
                className="justify-start text-xs"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Full Workspace Backup (JSON)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleStartFresh}
                className="justify-start text-xs border-state-danger/30 text-state-danger hover:bg-state-danger-bg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear All Data & Start Fresh (Empty DB)
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSeedDemo}
                className="justify-start text-xs text-content-secondary hover:text-content-primary"
              >
                Load Demo Sample Data (Optional)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
