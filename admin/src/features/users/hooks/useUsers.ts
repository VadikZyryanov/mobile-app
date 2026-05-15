import { useQuery } from '@tanstack/react-query';
import { qk, type UsersListFilters } from '@/lib/queryKeys';
import { listUsers, type ListUsersFilters } from '../api/listUsers';

export function useUsers(filters: ListUsersFilters) {
  return useQuery({
    queryKey: qk.users.list(filters as UsersListFilters),
    queryFn: () => listUsers(filters),
  });
}
