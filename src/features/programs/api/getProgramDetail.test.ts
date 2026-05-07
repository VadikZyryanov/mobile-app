import { supabase } from '@/lib/supabase';
import { getProgramDetail } from './getProgramDetail';

const fromMock = supabase.from as jest.Mock;

describe('getProgramDetail', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает program с join program_workouts.workout', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: {
        id: 'p1',
        slug: '8-week',
        title: '8 weeks',
        program_workouts: [
          {
            program_id: 'p1',
            week: 1,
            day_of_week: 1,
            workout_id: 'w1',
            workout: { slug: 'upper', title: 'Upper' },
          },
        ],
      },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) });

    const res = await getProgramDetail('8-week');
    expect(res.schedule).toHaveLength(1);
    expect(res.schedule[0]!.workout.slug).toBe('upper');
  });

  it('бросает error', async () => {
    const single = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'nf' } });
    const eq = jest.fn(() => ({ single }));
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) });
    await expect(getProgramDetail('x')).rejects.toEqual({ message: 'nf' });
  });
});
