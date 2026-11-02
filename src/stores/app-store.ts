import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency } from '@/lib/types';

interface AppState {
  sidebarOpen: boolean;
  dateRange: 'week' | 'month' | 'quarter' | 'year';
  companyName: string;
  defaultCurrency: Currency;
  timezone: string;
  theme: 'light' | 'dark';
  hasSeenInstallPrompt: boolean;
  hasRequestedNotifications: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setDateRange: (range: 'week' | 'month' | 'quarter' | 'year') => void;
  setCompanyName: (name: string) => void;
  setDefaultCurrency: (currency: Currency) => void;
  setTimezone: (tz: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setHasSeenInstallPrompt: (seen: boolean) => void;
  setHasRequestedNotifications: (requested: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      dateRange: 'month',
      companyName: 'RHIZAN Technologies',
      defaultCurrency: 'ETB',
      timezone: 'Africa/Addis_Ababa',
      theme: 'light',
      hasSeenInstallPrompt: false,
      hasRequestedNotifications: false,

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setDateRange: (range) => set({ dateRange: range }),
      setCompanyName: (name) => set({ companyName: name }),
      setDefaultCurrency: (currency) => set({ defaultCurrency: currency }),
      setTimezone: (tz) => set({ timezone: tz }),
      setTheme: (theme) => set({ theme: theme }),
      setHasSeenInstallPrompt: (seen) => set({ hasSeenInstallPrompt: seen }),
      setHasRequestedNotifications: (requested) => set({ hasRequestedNotifications: requested }),
    }),
    {
      name: 'rhizan-app-settings',
    }
  )
);
