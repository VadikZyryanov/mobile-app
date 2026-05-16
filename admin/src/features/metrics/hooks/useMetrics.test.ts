import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { createTestQueryClient } from '../../../../tests/utils/renderWithProviders';

vi.mock('../api/getMetrics', () => ({
  getRegistrationsDaily: vi.fn().mockResolvedValue([{ day: '2026-05-01', new_users: 1 }]),
  getSubscriptionEventsDaily: vi.fn().mockResolvedValue([]),
  getTierDistribution: vi.fn().mockResolvedValue([{ tier: 'free', count: 5 }]),
  getActiveSubs: vi.fn().mockResolvedValue([{ tier: 'basic', count: 2 }]),
  getContentStats: vi
    .fn()
    .mockResolvedValue({
      exercises_count: 10,
      workouts_count: 5,
      programs_count: 2,
      blog_posts_count: 3,
      foods_count: 74,
      total_users: 100,
    }),
}));

import {
  useRegistrationsDaily,
  useTierDistribution,
  useActiveSubs,
  useContentStats,
} from './useMetrics';

function createWrapper() {
  const client: QueryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe('useRegistrationsDaily', () => {
  it('возвращает данные после загрузки', async () => {
    const { result } = renderHook(() => useRegistrationsDaily(30), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ day: '2026-05-01', new_users: 1 }]);
  });
});

describe('useTierDistribution', () => {
  it('возвращает данные', async () => {
    const { result } = renderHook(() => useTierDistribution(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.tier).toBe('free');
  });
});

describe('useActiveSubs', () => {
  it('возвращает данные', async () => {
    const { result } = renderHook(() => useActiveSubs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useContentStats', () => {
  it('возвращает данные', async () => {
    const { result } = renderHook(() => useContentStats(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total_users).toBe(100);
  });
});
