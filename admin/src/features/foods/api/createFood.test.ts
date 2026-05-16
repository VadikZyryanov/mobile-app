import { describe, expect, it, vi, beforeEach } from 'vitest';

const insertMock = vi.fn();
const selectMock = vi.fn();
const singleMock = vi.fn();
const fromMock = vi.fn();
const logMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));
vi.mock('@/lib/audit', () => ({
  logAdminAction: (...a: unknown[]) => logMock(...a),
}));

import { createFood } from './createFood';

function makeBuilder(result: { data: unknown; error: unknown }) {
  return {
    insert: (...a: unknown[]) => {
      insertMock(...a);
      return {
        select: (...b: unknown[]) => {
          selectMock(...b);
          return {
            single: () => {
              singleMock();
              return Promise.resolve(result);
            },
          };
        },
      };
    },
  };
}

beforeEach(() => {
  fromMock.mockReset();
  insertMock.mockReset();
  selectMock.mockReset();
  singleMock.mockReset();
  logMock.mockReset();
});

describe('createFood', () => {
  it('happy: insert + select + logAdminAction', async () => {
    const row = {
      id: 'f1',
      slug: 'chicken',
      name: 'Курица',
      brand: null,
      kcal_per_100g: 165,
      protein_per_100g: 31,
      fat_per_100g: 3.6,
      carbs_per_100g: 0,
      created_at: '',
      updated_at: '',
      deleted_at: null,
    };
    fromMock.mockReturnValue(makeBuilder({ data: row, error: null }));
    logMock.mockResolvedValueOnce(undefined);
    const r = await createFood({
      slug: 'chicken',
      name: 'Курица',
      kcal_per_100g: 165,
      protein_per_100g: 31,
      fat_per_100g: 3.6,
      carbs_per_100g: 0,
    });
    expect(insertMock).toHaveBeenCalled();
    expect(logMock).toHaveBeenCalledWith('create', 'food', 'f1', null, row);
    expect(r).toEqual(row);
  });

  it('throw if error', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: new Error('dup') }));
    await expect(
      createFood({
        slug: 'a',
        name: 'a',
        kcal_per_100g: 0,
        protein_per_100g: 0,
        fat_per_100g: 0,
        carbs_per_100g: 0,
      }),
    ).rejects.toThrow('dup');
    expect(logMock).not.toHaveBeenCalled();
  });
});
