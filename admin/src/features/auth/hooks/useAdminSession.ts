import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '../store/auth.store';
import { fetchAdminProfile } from '../api/fetchAdminProfile';

let bootstrapped = false;

export function useAdminSession() {
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const errorMessage = useAuthStore((s) => s.errorMessage);

  useEffect(() => {
    if (bootstrapped) return;
    bootstrapped = true;
    void bootstrap();

    const { data } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      const store = useAuthStore.getState();
      if (event === 'SIGNED_OUT' || !nextSession) {
        store.reset();
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        store.setSession(nextSession);
        try {
          const p = await fetchAdminProfile(nextSession.user.id);
          if (!p || !p.is_admin) {
            await supabase.auth.signOut();
            store.reset();
            store.setStatus('forbidden', 'Этот аккаунт не админ. Доступ запрещён.');
            return;
          }
          store.setProfile(p);
          store.setStatus('authenticated');
        } catch (e) {
          store.setStatus('error', e instanceof Error ? e.message : 'Ошибка загрузки профиля');
        }
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return {
    status,
    session,
    profile,
    isAdmin: profile?.is_admin ?? false,
    errorMessage,
  };
}

async function bootstrap() {
  const store = useAuthStore.getState();
  store.setStatus('loading');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      store.reset();
      return;
    }
    store.setSession(data.session);
    const profile = await fetchAdminProfile(data.session.user.id);
    if (!profile || !profile.is_admin) {
      await supabase.auth.signOut();
      store.reset();
      store.setStatus('forbidden', 'Этот аккаунт не админ.');
      return;
    }
    store.setProfile(profile);
    store.setStatus('authenticated');
  } catch (e) {
    store.setStatus('error', e instanceof Error ? e.message : 'Ошибка инициализации');
  }
}

// Test-only helper
export function __resetBootstrap() {
  bootstrapped = false;
}
