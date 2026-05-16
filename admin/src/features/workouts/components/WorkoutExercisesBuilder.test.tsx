import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/features/exercises/api/listExercises', () => ({
  listExercises: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
}));

import { WorkoutExercisesBuilder, makeUid, type BuilderRow } from './WorkoutExercisesBuilder';

describe('WorkoutExercisesBuilder', () => {
  it('пустое состояние — подсказка', () => {
    render(<WorkoutExercisesBuilder value={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/Добавь упражнения/i)).toBeTruthy();
  });

  it('добавление новой строки вызывает onChange', () => {
    const onChange = vi.fn();
    render(<WorkoutExercisesBuilder value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('Добавить'));
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls[0]![0] as BuilderRow[];
    expect(next).toHaveLength(1);
    expect(next[0]!.sets).toBe(3);
    expect(next[0]!.reps).toBe('10');
  });

  it('удаление строки', () => {
    const onChange = vi.fn();
    const row: BuilderRow = {
      uid: makeUid(),
      exercise_id: 'e1',
      exercise: { id: 'e1', name: 'Жим' },
      sets: 3,
      reps: '10',
      rest_seconds: 60,
      notes: '',
    };
    render(<WorkoutExercisesBuilder value={[row]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Удалить'));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
