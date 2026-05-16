import { describe, expect, it, vi, beforeEach } from 'vitest';

const orderMock = vi.fn();
const rangeMock = vi.fn();
const isMock = vi.fn();
const orMock = vi.fn();
const selectMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));

import { listFoods } from './listFoods';

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
  orMock.mockReset();
  selectMock.mockReset();
});

describe('listFoods', () => {
  it('по умолчанию фильтрует soft-deleted (is deleted_at null)', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listFoods({ offset: 0, limit: 50 });
    expect(isMock).toHaveBeenCalledWith('deleted_at', null);
  });

  it('includeDeleted=true — не фильтрует', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listFoods({ offset: 0, limit: 50, includeDeleted: true });
    expect(isMock).not.toHaveBeenCalled();
  });

  it('search — добавляет or с ilike по name/slug/brand', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listFoods({ offset: 0, limit: 50, search: 'chicken' });
    expect(orMock).toHaveBeenCalledTimes(1);
    expect(orMock.mock.calls[0]![0]).toMatch(/name\.ilike\.%chicken%/);
    expect(orMock.mock.calls[0]![0]).toMatch(/slug\.ilike\.%chicken%/);
    expect(orMock.mock.calls[0]![0]).toMatch(/brand\.ilike\.%chicken%/);
  });

  it('error — throw', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: new Error('boom'), count: null }));
    await expect(listFoods({ offset: 0, limit: 50 })).rejects.toThrow('boom');
  });
});
