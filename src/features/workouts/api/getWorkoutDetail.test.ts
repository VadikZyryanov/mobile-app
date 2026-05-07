import { supabase } from '@/lib/supabase';
import { getWorkoutDetail } from './getWorkoutDetail';

const fromMock = supabase.from as jest.Mock;

describe('getWorkoutDetail', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает workout с join workout_exercises+exercise', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: 'w1',
        slug: 'upper-power',
        title: 'Upper',
        workout_exercises: [
          {
            workout_id: 'w1',
            position: 1,
            exercise_id: 'e1',
            sets: 4,
            reps: '6',
            rest_seconds: 120,
            notes: null,
            exercise: { slug: 'squat', name: 'Squat' },
          },
        ],
      },
      error: null,
    });
    const order = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ single, order }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });

    const res = await getWorkoutDetail('upper-power');
    expect(fromMock).toHaveBeenCalledWith('workouts');

    expect((select.mock.calls as unknown[][])[0]?.[0]).toContain('workout_exercises');
    expect(eq).toHaveBeenCalledWith('slug', 'upper-power');
    expect(res.exercises).toHaveLength(1);

    expect(res.exercises[0]!.exercise.slug).toBe('squat');
  });

  it('бросает error', async () => {
    const single = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'nf' } });
    const eq = jest.fn(() => ({ single }));
    const select = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ select });
    await expect(getWorkoutDetail('x')).rejects.toEqual({ message: 'nf' });
  });
});
