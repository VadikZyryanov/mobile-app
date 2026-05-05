import { create } from 'zustand';

export type AuthState = {
  isAuthenticated: boolean;
  userId: string | null;
  signIn: (userId: string) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,
  signIn: (userId) => set({ isAuthenticated: true, userId }),
  signOut: () => set({ isAuthenticated: false, userId: null }),
}));
