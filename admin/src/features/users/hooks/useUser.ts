import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryKeys';
import { getUserById } from '../api/getUserById';

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: id ? qk.users.detail(id) : ['users', 'detail', 'noop'],
    queryFn: () => getUserById(id as string),
    enabled: Boolean(id),
  });
}
