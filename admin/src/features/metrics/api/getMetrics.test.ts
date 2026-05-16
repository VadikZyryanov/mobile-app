import { describe, expect, it, vi, beforeEach } from 'vitest';

const rpcMock = vi.fn();
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: (...a: unknown[]) => rpcMock(...a) } }));

import {
  getRegistrationsDaily,
  getSubscriptionEventsDaily,
  getTierDistribution,
  getActiveSubs,
  getContentStats,
} from './getMetrics';

beforeEach(() => rpcMock.mockReset());

describe('getRegistrationsDaily', () => {
  it('вызывает нужный RPC и возвращает данные', async () => {
    const data = [{ day: '2026-05-01', new_users: 3 }];
    rpcMock.mockResolvedValueOnce({ data, error: null });
    const result = await getRegistrationsDaily(30);
    expect(rpcMock).toHaveBeenCalledWith('admin_get_registrations_daily', { p_days: 30 });
    expect(result).toEqual(data);
  });

  it('throw при ошибке', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: new Error('err') });
    await expect(getRegistrationsDaily(7)).rejects.toThrow('err');
  });
});

describe('getSubscriptionEventsDaily', () => {
  it('вызывает RPC с p_days', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await getSubscriptionEventsDaily(7);
    expect(rpcMock).toHaveBeenCalledWith('admin_get_subscription_events_daily', { p_days: 7 });
  });
});

describe('getTierDistribution', () => {
  it('вызывает RPC без аргументов', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await getTierDistribution();
    expect(rpcMock).toHaveBeenCalledWith('admin_get_tier_distribution');
  });
});

describe('getActiveSubs', () => {
  it('вызывает RPC без аргументов', async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await getActiveSubs();
    expect(rpcMock).toHaveBeenCalledWith('admin_get_active_subs');
  });
});

describe('getContentStats', () => {
  it('возвращает первую строку результата', async () => {
    const row = {
      exercises_count: 10,
      workouts_count: 5,
      programs_count: 2,
      blog_posts_count: 3,
      foods_count: 74,
      total_users: 100,
    };
    rpcMock.mockResolvedValueOnce({ data: [row], error: null });
    const result = await getContentStats();
    expect(result).toEqual(row);
  });
});
