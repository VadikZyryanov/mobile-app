import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { signOut as signOutApi } from '@/features/auth/api/signOut';
import { supabase } from '@/lib/supabase';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  user: null,

  hydrate: async () => {
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      status: data.session ? 'authenticated' : 'unauthenticated',
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        status: session ? 'authenticated' : 'unauthenticated',
      });
    });
  },

  signOut: async () => {
    await signOutApi();
  },
}));
