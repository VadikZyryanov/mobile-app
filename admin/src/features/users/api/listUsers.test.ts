import { describe, expect, it, vi, beforeEach } from 'vitest';

const orderMock = vi.fn();
const rangeMock = vi.fn();
const eqMock = vi.fn();
const orMock = vi.fn();
const selectMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import { listUsers } from './listUsers';

function makeBuilder(result: { data: unknown; error: unknown; count: number | null }) {
  const builder: Record<string, unknown> = {
    select: (...a: unknown[]) => {
      selectMock(...a);
      return builder;
    },
    order: (...a: unknown[]) => {
      orderMock(...a);
      return builder;
    },
    range: (...a: unknown[]) => {
      rangeMock(...a);
      return builder;
    },
    eq: (...a: unknown[]) => {
      eqMock(...a);
      return builder;
    },
    or: (...a: unknown[]) => {
      orMock(...a);
      return builder;
    },
    then: (resolve: (v: typeof result) => unknown) => Promise.resolve(resolve(result)),
  };
  return builder;
}

describe('listUsers', () => {
  beforeEach(() => {
    fromMock.mockReset();
    orderMock.mockReset();
    rangeMock.mockReset();
    eqMock.mockReset();
    orMock.mockReset();
    selectMock.mockReset();
  });

  it('без фильтров — без eq/or', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    const result = await listUsers({ offset: 0, limit: 50 });
    expect(result.total).toBe(0);
    expect(result.rows).toEqual([]);
    expect(rangeMock).toHaveBeenCalledWith(0, 49);
    expect(eqMock).not.toHaveBeenCalled();
    expect(orMock).not.toHaveBeenCalled();
  });

  it('с tier — добавляет eq', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listUsers({ offset: 0, limit: 50, tier: 'pro' });
    expect(eqMock).toHaveBeenCalledWith('subscription_tier', 'pro');
  });

  it('tier=all — без eq', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listUsers({ offset: 0, limit: 50, tier: 'all' });
    expect(eqMock).not.toHaveBeenCalled();
  });

  it('с search — добавляет or с ilike', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listUsers({ offset: 0, limit: 50, search: 'foo' });
    expect(orMock).toHaveBeenCalledTimes(1);
    expect(orMock.mock.calls[0]![0]).toMatch(/email\.ilike\.%foo%/);
    expect(orMock.mock.calls[0]![0]).toMatch(/display_name\.ilike\.%foo%/);
  });

  it('error → throw', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: new Error('boom'), count: null }));
    await expect(listUsers({ offset: 0, limit: 50 })).rejects.toThrow('boom');
  });
});
