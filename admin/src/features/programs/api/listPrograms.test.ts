import { describe, expect, it, vi, beforeEach } from 'vitest';

const orderMock = vi.fn();
const rangeMock = vi.fn();
const eqMock = vi.fn();
const orMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));

import { listPrograms } from './listPrograms';

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
  eqMock.mockReset();
  orMock.mockReset();
});

describe('listPrograms', () => {
  it('minTier + difficulty — eq filter', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listPrograms({ offset: 0, limit: 50, minTier: 'pro', difficulty: 3 });
    expect(eqMock).toHaveBeenCalledWith('min_tier', 'pro');
    expect(eqMock).toHaveBeenCalledWith('difficulty', 3);
  });

  it('search — or ilike title/slug', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listPrograms({ offset: 0, limit: 50, search: 'x' });
    expect(orMock.mock.calls[0]![0]).toMatch(/title\.ilike/);
  });
});
