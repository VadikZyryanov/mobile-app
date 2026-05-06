import { useQuery } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery<Profile | null>({
    queryKey: ['profile', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return data;
    },
  });
}
