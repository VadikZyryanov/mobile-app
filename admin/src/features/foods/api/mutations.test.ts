import { describe, expect, it, vi, beforeEach } from 'vitest';

const fromMock = vi.fn();
const logMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));
vi.mock('@/lib/audit', () => ({
  logAdminAction: (...a: unknown[]) => logMock(...a),
}));

import { updateFood } from './updateFood';
import { deleteFood } from './deleteFood';
import { restoreFood } from './restoreFood';

interface SampleFood {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const SAMPLE: SampleFood = {
  id: 'f1',
  slug: 's',
  name: 'n',
  brand: null,
  kcal_per_100g: 1,
  protein_per_100g: 1,
  fat_per_100g: 1,
  carbs_per_100g: 1,
  created_at: '',
  updated_at: '',
  deleted_at: null,
};

function makeChain(before: SampleFood, after: SampleFood) {
  let call = 0;
  return {
    select: () => ({
      eq: () => ({
        single: () => {
          call += 1;
          return Promise.resolve({ data: before, error: null });
        },
      }),
    }),
    update: (payload: Record<string, unknown>) => ({
      eq: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: { ...after, ...payload },
              error: null,
            }),
        }),
      }),
    }),
    _call: () => call,
  };
}

beforeEach(() => {
  fromMock.mockReset();
  logMock.mockReset();
  logMock.mockResolvedValue(undefined);
});

describe('updateFood', () => {
  it('читает before, пишет patch, логирует update', async () => {
    fromMock.mockReturnValue(makeChain(SAMPLE, SAMPLE));
    await updateFood('f1', { name: 'new' });
    expect(logMock).toHaveBeenCalledWith(
      'update',
      'food',
      'f1',
      SAMPLE,
      expect.objectContaining({ name: 'new' }),
    );
  });
});

describe('deleteFood', () => {
  it('ставит deleted_at и логирует delete', async () => {
    fromMock.mockReturnValue(makeChain(SAMPLE, SAMPLE));
    const r = await deleteFood('f1');
    expect(r.deleted_at).toBeDefined();
    expect(logMock).toHaveBeenCalledWith('delete', 'food', 'f1', SAMPLE, expect.any(Object));
  });
});

describe('restoreFood', () => {
  it('обнуляет deleted_at и логирует restore', async () => {
    fromMock.mockReturnValue(makeChain({ ...SAMPLE, deleted_at: 'x' }, SAMPLE));
    await restoreFood('f1');
    expect(logMock).toHaveBeenCalledWith(
      'restore',
      'food',
      'f1',
      expect.objectContaining({ deleted_at: 'x' }),
      expect.objectContaining({ deleted_at: null }),
    );
  });
});
