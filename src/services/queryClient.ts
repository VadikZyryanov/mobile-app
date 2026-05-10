import { QueryClient } from '@tanstack/react-query';
import type { Query } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 0,
      networkMode: 'online',
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'rq.cache.v1',
  throttleTime: 1000,
});

export const persistOptions = {
  persister,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  dehydrateOptions: {
    shouldDehydrateQuery: (q: Query) => {
      const PERSISTABLE = new Set(['exercises', 'workouts', 'programs', 'blog']);
      const SKIP_SECONDARY = new Set(['video-url', 'gif-url']);
      return (
        q.state.status === 'success' &&
        PERSISTABLE.has(String(q.queryKey[0])) &&
        !(q.queryKey[0] === 'exercises' && SKIP_SECONDARY.has(String(q.queryKey[1])))
      );
    },
  },
};
