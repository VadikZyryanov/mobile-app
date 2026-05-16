import { describe, expect, it, vi, beforeEach } from 'vitest';

const orderMock = vi.fn();
const rangeMock = vi.fn();
const isMock = vi.fn();
const eqMock = vi.fn();
const orMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));

import { listWorkouts } from './listWorkouts';

function makeBuilder(result: { data: unknown; error: unknown; count: number | null }) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    order: (...a: unknown[]) => {
      orderMock(...a);
      return builder;
    },
    range: (...a: unknown[]) => {
      rangeMock(...a);
      return builder;
    },
    is: (...a: unknown[]) => {
      isMock(...a);
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

beforeEach(() => {
  fromMock.mockReset();
  orderMock.mockReset();
  rangeMock.mockReset();
  isMock.mockReset();
  eqMock.mockReset();
  orMock.mockReset();
});

describe('listWorkouts', () => {
  it('default — фильтрует soft-deleted', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listWorkouts({ offset: 0, limit: 50 });
    expect(isMock).toHaveBeenCalledWith('deleted_at', null);
  });

  it('category + minTier — eq', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listWorkouts({ offset: 0, limit: 50, category: 'upper', minTier: 'basic' });
    expect(eqMock).toHaveBeenCalledWith('category', 'upper');
    expect(eqMock).toHaveBeenCalledWith('min_tier', 'basic');
  });

  it('search — or ilike', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listWorkouts({ offset: 0, limit: 50, search: 'x' });
    expect(orMock.mock.calls[0]![0]).toMatch(/title\.ilike/);
  });
});
