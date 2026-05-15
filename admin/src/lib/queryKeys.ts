export interface UsersListFilters {
  tier?: string;
  search?: string;
  offset: number;
  limit: number;
}

export interface ExercisesListFilters {
  search?: string;
  primaryMuscle?: string;
  minTier?: string;
  includeDeleted?: boolean;
  offset: number;
  limit: number;
}

export interface WorkoutsListFilters {
  search?: string;
  category?: string;
  minTier?: string;
  includeDeleted?: boolean;
  offset: number;
  limit: number;
}

export interface ProgramsListFilters {
  search?: string;
  minTier?: string;
  difficulty?: number;
  offset: number;
  limit: number;
}

export interface BlogPostsListFilters {
  search?: string;
  status?: 'all' | 'published' | 'draft';
  offset: number;
  limit: number;
}

export interface FoodsListFilters {
  search?: string;
  includeDeleted?: boolean;
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
  exercises: {
    all: ['exercises'] as const,
    list: (f: ExercisesListFilters) => ['exercises', 'list', f] as const,
    detail: (id: string) => ['exercises', 'detail', id] as const,
  },
  workouts: {
    all: ['workouts'] as const,
    list: (f: WorkoutsListFilters) => ['workouts', 'list', f] as const,
    detail: (id: string) => ['workouts', 'detail', id] as const,
  },
  programs: {
    all: ['programs'] as const,
    list: (f: ProgramsListFilters) => ['programs', 'list', f] as const,
    detail: (id: string) => ['programs', 'detail', id] as const,
  },
  blogPosts: {
    all: ['blogPosts'] as const,
    list: (f: BlogPostsListFilters) => ['blogPosts', 'list', f] as const,
    detail: (id: string) => ['blogPosts', 'detail', id] as const,
  },
  foods: {
    all: ['foods'] as const,
    list: (f: FoodsListFilters) => ['foods', 'list', f] as const,
    detail: (id: string) => ['foods', 'detail', id] as const,
  },
} as const;
