import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      networkMode: 'always',
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: 'always',
      retry: 0,
    },
  },
});
