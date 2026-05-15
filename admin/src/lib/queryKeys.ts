export interface UsersListFilters {
  tier?: string;
  search?: string;
  offset: number;
  limit: number;
}

export const qk = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (f: UsersListFilters) => ['users', 'list', f] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
} as const;
