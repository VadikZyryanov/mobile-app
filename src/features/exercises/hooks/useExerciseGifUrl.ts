import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getExerciseGifUrl } from '../api/getExerciseGifUrl';

export function useExerciseGifUrl(slug: string) {
  return useQuery({
    queryKey: qk.exercises.gifUrl(slug),
    queryFn: () => getExerciseGifUrl(slug),
    staleTime: 50 * 60 * 1000,
    gcTime: 55 * 60 * 1000,
  });
}
