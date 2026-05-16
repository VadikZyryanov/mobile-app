import { describe, expect, it, vi, beforeEach } from 'vitest';

const orderMock = vi.fn();
const rangeMock = vi.fn();
const isMock = vi.fn();
const eqMock = vi.fn();
const orMock = vi.fn();
const selectMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));

import { listExercises } from './listExercises';

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
  selectMock.mockReset();
});

describe('listExercises', () => {
  it('по умолчанию: deleted_at IS null', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listExercises({ offset: 0, limit: 50 });
    expect(isMock).toHaveBeenCalledWith('deleted_at', null);
  });

  it('includeDeleted=true — без is', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listExercises({ offset: 0, limit: 50, includeDeleted: true });
    expect(isMock).not.toHaveBeenCalled();
  });

  it('primaryMuscle — eq', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listExercises({ offset: 0, limit: 50, primaryMuscle: 'chest' });
    expect(eqMock).toHaveBeenCalledWith('primary_muscle', 'chest');
  });

  it('minTier — eq', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listExercises({ offset: 0, limit: 50, minTier: 'pro' });
    expect(eqMock).toHaveBeenCalledWith('min_tier', 'pro');
  });

  it('search — or ilike name/slug', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listExercises({ offset: 0, limit: 50, search: 'squat' });
    expect(orMock.mock.calls[0]![0]).toMatch(/name\.ilike\.%squat%/);
    expect(orMock.mock.calls[0]![0]).toMatch(/slug\.ilike\.%squat%/);
  });
});
