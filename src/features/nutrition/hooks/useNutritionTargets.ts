import { useMemo } from 'react';
import { computeTargets } from '../lib/computeTargets';
import type { Targets } from '../lib/computeTargets';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useNutritionTargets(profile: Profile | undefined): Targets | null {
  return useMemo(() => {
    if (!profile) return null;
    return computeTargets(profile);
  }, [profile]);
}
