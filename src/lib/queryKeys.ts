export const qk = {
  exercises: {
    all: ['exercises'] as const,
    list: (filter?: string) => ['exercises', 'list', filter ?? 'all'] as const,
    detail: (slug: string) => ['exercises', 'detail', slug] as const,
    gifUrl: (slug: string) => ['exercises', 'gif-url', slug] as const,
    videoUrl: (slug: string) => ['exercises', 'video-url', slug] as const,
  },
  workouts: {
    all: ['workouts'] as const,
    list: (category?: string) => ['workouts', 'list', category ?? 'all'] as const,
    detail: (slug: string) => ['workouts', 'detail', slug] as const,
  },
  programs: {
    all: ['programs'] as const,
    list: () => ['programs', 'list'] as const,
    detail: (slug: string) => ['programs', 'detail', slug] as const,
  },
  blog: {
    all: ['blog'] as const,
    list: () => ['blog', 'list'] as const,
    detail: (slug: string) => ['blog', 'detail', slug] as const,
  },
  search: {
    all: ['search'] as const,
    query: (q: string) => ['search', 'query', q] as const,
  },
  rc: {
    offerings: ['rc', 'offerings'] as const,
    customerInfo: (uid: string) => ['rc', 'customer-info', uid] as const,
  },
} as const;
