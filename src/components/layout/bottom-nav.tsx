import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Users,
  Video,
  MoreHorizontal,
  CheckSquare,
  FileBarChart,
  Calendar,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);

  const mainNav = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Finance', to: '/finance', icon: Wallet },
    { label: 'Clients', to: '/clients', icon: Users },
    { label: 'Marketing', to: '/marketing', icon: Video },
  ];

  const moreNav = [
    { label: 'Tasks & Reminders', to: '/tasks', icon: CheckSquare, desc: 'Priorities & to-do items' },
    { label: 'Meetings & Calendar', to: '/meetings', icon: Calendar, desc: 'Scheduled calls & agendas' },
    { label: 'Reports & Analytics', to: '/reports', icon: FileBarChart, desc: 'Executive monthly summaries' },
    { label: 'Settings', to: '/settings', icon: Settings, desc: 'Preferences, profile & backups' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex min-h-[4rem] h-[calc(4rem+env(safe-area-inset-bottom))] items-center justify-around border-t border-border bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-nav lg:hidden">
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center py-1 transition-colors select-none',
                  isActive
                    ? 'text-brand-primary font-semibold'
                    : 'text-content-secondary hover:text-content-primary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-all',
                      isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-content-secondary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center py-1 text-content-secondary hover:text-content-primary transition-colors select-none"
        >
          <div className="flex h-7 w-12 items-center justify-center rounded-full text-content-secondary">
            <MoreHorizontal className="h-4 w-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </nav>

      {/* More Options Modal / Bottom Sheet */}
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Additional Modules</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 pt-2">
            {moreNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-hover transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-content-primary">{item.label}</span>
                    <span className="text-xs text-content-secondary">{item.desc}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
