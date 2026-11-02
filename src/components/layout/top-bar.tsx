import { Menu, Bell, Wifi, WifiOff, Plus, Lock } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export function TopBar() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const companyName = useAppStore((s) => s.companyName);
  const defaultCurrency = useAppStore((s) => s.defaultCurrency);
  const userName = useAuthStore((s) => s.userName) || 'Founder';
  const lock = useAuthStore((s) => s.lock);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Menu"
          className="lg:hidden text-content-primary"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white font-bold text-sm tracking-wider shadow-sm">
            R
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight text-content-primary tracking-tight">
              {companyName}
            </span>
            <span className="text-[10px] font-medium leading-none text-brand-secondary">
              Growth Workspace
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Badge
          variant={isOnline ? 'success' : 'warning'}
          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium py-0.5 px-2"
        >
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Offline Ready</span>
            </>
          )}
        </Badge>

        <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-semibold text-brand-primary border-brand-primary/20">
          {defaultCurrency}
        </Badge>

        <Link to="/tasks">
          <Button variant="ghost" size="icon-sm" className="relative text-content-secondary hover:text-content-primary">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-state-danger" />
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            lock();
          }}
          title="Lock Workspace"
          className="text-content-secondary hover:text-content-primary"
        >
          <Lock className="h-4 w-4" />
        </Button>

        <Link to="/settings" className="flex items-center gap-2 pl-1">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="text-xs font-semibold bg-brand-primary text-white">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
