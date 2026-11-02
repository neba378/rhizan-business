import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  pin: string;
  userName: string;
  userId: string;
  userEmail: string;

  unlockWithPin: (enteredPin: string) => boolean;
  lock: () => void;
  setPin: (newPin: string) => void;
  login: (userId: string, name: string, email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false, // Requires PIN to unlock
      pin: '1223',
      userName: 'Neba',
      userId: 'neba',
      userEmail: 'neba@rhizan.com',

      unlockWithPin: (enteredPin: string) => {
        if (enteredPin === get().pin) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },

      lock: () => set({ isAuthenticated: false }),

      setPin: (newPin: string) => set({ pin: newPin }),

      login: (userId, name, email) =>
        set({
          isAuthenticated: true,
          userId,
          userName: name,
          userEmail: email,
        }),

      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'rhizan-auth-v2',
    }
  )
);
