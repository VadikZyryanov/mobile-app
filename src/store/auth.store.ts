import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { signOut as signOutApi } from '@/features/auth/api/signOut';
import { mediaCache } from '@/lib/mediaCache';
import { supabase } from '@/lib/supabase';
import { storage, StorageKeys } from '@/lib/storage';
import { identifyUser, resetUser } from '@/features/subscription/api/identifyUser';
import { queryClient, persister } from '@/services/queryClient';

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

      if (session?.user?.id) {
        identifyUser(session.user.id).catch(() => {});
      }
    });
  },

  signOut: async () => {
    await signOutApi();
    resetUser().catch(() => {});
    await persister.removeClient();
    queryClient.clear();
    await mediaCache.clearAll();
    await storage.set(StorageKeys.rqPersistorBuster, String(Date.now()));
  },
}));
