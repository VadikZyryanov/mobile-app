import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

export type AuthStatus =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'forbidden'
  | 'unauthenticated'
  | 'error';

export interface AdminProfile {
  id: string;
  is_admin: boolean;
  display_name: string | null;
  email: string | null;
}

interface AuthState {
  session: Session | null;
  profile: AdminProfile | null;
  status: AuthStatus;
  errorMessage: string | null;
  setSession: (s: Session | null) => void;
  setProfile: (p: AdminProfile | null) => void;
  setStatus: (s: AuthStatus, errorMessage?: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  status: 'idle',
  errorMessage: null,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setStatus: (status, errorMessage = null) => set({ status, errorMessage }),
  reset: () => set({ session: null, profile: null, status: 'unauthenticated', errorMessage: null }),
}));
