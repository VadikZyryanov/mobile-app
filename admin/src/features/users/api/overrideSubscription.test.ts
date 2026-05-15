import { describe, expect, it, vi, beforeEach } from 'vitest';

const rpcMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

import { overrideSubscription } from './overrideSubscription';

describe('overrideSubscription', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('success → возвращает обновлённый row', async () => {
    rpcMock.mockResolvedValue({ data: { id: 'u1', subscription_tier: 'pro_max' }, error: null });
    const result = await overrideSubscription({
      userId: 'u1',
      tier: 'pro_max',
      status: 'active',
      expiresAt: '2026-06-15T00:00:00Z',
      willRenew: true,
      note: 'грант',
    });
    expect(result).toEqual({ id: 'u1', subscription_tier: 'pro_max' });
    expect(rpcMock).toHaveBeenCalledWith(
      'admin_override_subscription',
      expect.objectContaining({
        p_user_id: 'u1',
        p_tier: 'pro_max',
        p_note: 'грант',
      }),
    );
  });

  it('forbidden error → throw', async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error('forbidden') });
    await expect(
      overrideSubscription({
        userId: 'u1',
        tier: 'pro',
        status: 'active',
        expiresAt: null,
        willRenew: false,
        note: 'note',
      }),
    ).rejects.toThrow('forbidden');
  });

  it('user_not_found → throw', async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error('user_not_found') });
    await expect(
      overrideSubscription({
        userId: 'missing',
        tier: 'pro',
        status: 'active',
        expiresAt: null,
        willRenew: false,
        note: 'n',
      }),
    ).rejects.toThrow('user_not_found');
  });
});
