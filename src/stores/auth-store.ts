import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;

  login: (userId: string, name: string, email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: true, // Default to true so founder lands immediately on workspace
      userId: 'founder-1',
      userName: 'RHIZAN Founder',
      userEmail: 'founder@rhizan.com',

      login: (userId, name, email) =>
        set({
          isAuthenticated: true,
          userId,
          userName: name,
          userEmail: email,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          userId: null,
          userName: null,
          userEmail: null,
        }),
    }),
    {
      name: 'rhizan-auth',
    }
  )
);
