import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getExerciseVideoUrl } from '../api/getExerciseVideoUrl';

export function useExerciseVideoUrl(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.exercises.videoUrl(slug),
    queryFn: () => getExerciseVideoUrl(slug),
    enabled,
    staleTime: 50 * 60 * 1000,
    gcTime: 55 * 60 * 1000,
  });
}
