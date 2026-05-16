import { describe, expect, it, vi, beforeEach } from 'vitest';

const rpcMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: (...a: unknown[]) => rpcMock(...a) },
}));

import { saveWorkout } from './saveWorkout';

beforeEach(() => rpcMock.mockReset());

describe('saveWorkout', () => {
  it('вызывает admin_save_workout_with_exercises с правильным payload', async () => {
    rpcMock.mockResolvedValueOnce({ data: { id: 'w1' }, error: null });
    const r = await saveWorkout(
      {
        slug: 's',
        title: 't',
        category: 'upper',
        duration_minutes: 30,
        difficulty: 2,
        min_tier: 'basic',
      },
      [{ exercise_id: 'e1', sets: 3, reps: '10', rest_seconds: 60 }],
    );
    expect(rpcMock).toHaveBeenCalledWith(
      'admin_save_workout_with_exercises',
      expect.objectContaining({
        p_workout: expect.objectContaining({ slug: 's', title: 't' }),
        p_exercises: expect.arrayContaining([expect.objectContaining({ exercise_id: 'e1' })]),
      }),
    );
    expect(r).toEqual({ id: 'w1' });
  });

  it('throw при error', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: new Error('nope') });
    await expect(
      saveWorkout(
        {
          slug: 's',
          title: 't',
          category: 'upper',
          duration_minutes: 1,
          difficulty: 1,
          min_tier: 'free',
        },
        [],
      ),
    ).rejects.toThrow('nope');
  });

  it('throw если RPC вернул пустой', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await expect(
      saveWorkout(
        {
          slug: 's',
          title: 't',
          category: 'upper',
          duration_minutes: 1,
          difficulty: 1,
          min_tier: 'free',
        },
        [],
      ),
    ).rejects.toThrow();
  });
});
