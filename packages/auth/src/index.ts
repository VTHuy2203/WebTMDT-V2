import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, AuthSession } from '@marketplace/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (session: AuthSession) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setSession: (session: AuthSession) => {
        set({
          user: session.user,
          token: session.token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      updateUser: (updatedFields: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return;
        set({
          user: { ...currentUser, ...updatedFields },
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      hasRole: (allowedRoles: UserRole[]) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        return allowedRoles.includes(user.role);
      },
    }),
    {
      name: 'marketplace-auth-storage',
    }
  )
);

export function checkPermission(user: User | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return allowedRoles.includes(user.role);
}
