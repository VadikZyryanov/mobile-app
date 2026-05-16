import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExercisesTable } from './ExercisesTable';
import type { Exercise } from '@/types/content';

const ROW: Exercise = {
  id: 'e1',
  slug: 'bench-press',
  name: 'Жим лёжа',
  description: null,
  primary_muscle: 'chest',
  secondary_muscles: ['triceps'],
  equipment: ['Штанга'],
  gif_path: 'gifs/x.gif',
  video_path: null,
  min_tier: 'basic',
  search_tsv: '',
  deleted_at: null,
  created_at: '',
  updated_at: '',
};

describe('ExercisesTable', () => {
  it('пусто', () => {
    render(<ExercisesTable rows={[]} />);
    expect(screen.getByText('Упражнения не найдены')).toBeTruthy();
  });

  it('рендерит и реагирует на клик', () => {
    const onClick = vi.fn();
    render(<ExercisesTable rows={[ROW]} onRowClick={onClick} />);
    expect(screen.getByText('Жим лёжа')).toBeTruthy();
    expect(screen.getByText('Грудь')).toBeTruthy();
    expect(screen.getByText('Basic')).toBeTruthy();
    fireEvent.click(screen.getByTestId('exercise-row'));
    expect(onClick).toHaveBeenCalledWith(ROW);
  });

  it('soft-deleted — opacity-50', () => {
    render(<ExercisesTable rows={[{ ...ROW, deleted_at: '2026-05-16' }]} />);
    expect(screen.getByTestId('exercise-row').className).toContain('opacity-50');
  });
});
