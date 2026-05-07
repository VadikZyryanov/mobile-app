import type { Tier } from '@/features/exercises/lib/tierGate';

export type SearchKind = 'exercise' | 'workout';

export type SearchResult = {
  kind: SearchKind;
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  cover_path: string | null;
  min_tier: Tier;
  rank: number;
};
