import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  FileSpreadsheet,
  PieChart,
  Users,
  GitPullRequest,
  Video,
  CalendarDays,
  CheckSquare,
  Calendar,
  FileBarChart,
  Settings,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const logout = useAuthStore((s) => s.logout);
  const userName = useAuthStore((s) => s.userName) || 'Founder';

  const navSections = [
    {
      title: 'BUSINESS WORKSPACE',
      items: [
        { label: 'Overview', to: '/', icon: LayoutDashboard, exact: true },
        { label: 'Finance Management', to: '/finance', icon: Wallet },
        { label: 'Transactions', to: '/finance/transactions', icon: Receipt, indent: true },
        { label: 'Invoices', to: '/finance/invoices', icon: FileSpreadsheet, indent: true },
        { label: 'Budgets', to: '/finance/budgets', icon: PieChart, indent: true },
        { label: 'Client CRM', to: '/clients', icon: Users },
        { label: 'Sales Pipeline', to: '/clients/pipeline', icon: GitPullRequest, indent: true },
        { label: 'Social & TikTok', to: '/marketing', icon: Video },
        { label: 'Content Calendar', to: '/marketing/calendar', icon: CalendarDays, indent: true },
      ],
    },
    {
      title: 'DAILY OPERATIONS',
      items: [
        { label: 'Tasks & Reminders', to: '/tasks', icon: CheckSquare },
        { label: 'Meetings & Calendar', to: '/meetings', icon: Calendar },
        { label: 'Reports & Analytics', to: '/reports', icon: FileBarChart },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        { label: 'System Settings', to: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
        open ? 'translate-x-0 shadow-modal' : '-translate-x-full'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary text-white font-bold text-base shadow-sm">
            R
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-brand-primary">RHIZAN</span>
            <span className="text-[10px] font-semibold tracking-wider text-content-secondary uppercase">
              Technologies
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-content-secondary hover:bg-surface-hover hover:text-content-primary lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="px-2 text-[10px] font-bold tracking-wider text-content-tertiary uppercase">
              {section.title}
            </h4>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        item.indent && 'ml-4 py-1.5 text-xs',
                        isActive
                          ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                          : 'text-content-secondary hover:bg-surface-hover hover:text-content-primary'
                      )
                    }
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', item.indent ? 'h-3.5 w-3.5' : '')} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User profile footer */}
      <div className="border-t border-border p-4 bg-surface-bg/50">
        <div className="flex items-center justify-between">
          <div className="flex flex-col truncate pr-2">
            <span className="text-xs font-semibold text-content-primary truncate">{userName}</span>
            <span className="text-[10px] text-content-secondary">Authorized Founder</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={logout}
            title="Sign out"
            className="text-content-secondary hover:text-state-danger hover:bg-state-danger-bg"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
