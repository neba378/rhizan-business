import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './bottom-nav';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { useAppStore } from '@/stores/app-store';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const location = useLocation();

  return (
    <div className="flex h-[100dvh] bg-surface-bg overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />

        <main className="flex-1 overflow-y-auto scroll-area pb-24 lg:pb-6">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}
