import { describe, expect, it } from 'vitest';
import { scheduleKey, scheduleToArray, type ScheduleMap } from './ProgramScheduleBuilder';

describe('scheduleKey', () => {
  it('форматирует ключ', () => {
    expect(scheduleKey(2, 3)).toBe('2-3');
  });
});

describe('scheduleToArray', () => {
  it('возвращает только заполненные ячейки в нужном порядке', () => {
    const sched: ScheduleMap = {
      '1-1': { workout_id: 'w1' },
      '1-3': { workout_id: 'w2' },
      '2-2': { workout_id: 'w3' },
    };
    expect(scheduleToArray(2, sched)).toEqual([
      { week: 1, day_of_week: 1, workout_id: 'w1' },
      { week: 1, day_of_week: 3, workout_id: 'w2' },
      { week: 2, day_of_week: 2, workout_id: 'w3' },
    ]);
  });

  it('игнорирует недели > weeks', () => {
    const sched: ScheduleMap = {
      '1-1': { workout_id: 'w1' },
      '3-1': { workout_id: 'w2' },
    };
    expect(scheduleToArray(2, sched)).toEqual([{ week: 1, day_of_week: 1, workout_id: 'w1' }]);
  });

  it('пропускает ячейки без workout_id', () => {
    const sched: ScheduleMap = {
      '1-1': { workout_id: null },
      '1-2': { workout_id: 'w1' },
    };
    expect(scheduleToArray(1, sched)).toEqual([{ week: 1, day_of_week: 2, workout_id: 'w1' }]);
  });
});
