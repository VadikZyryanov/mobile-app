import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WorkoutsTable } from './WorkoutsTable';
import type { Workout } from '@/types/content';

const ROW: Workout = {
  id: 'w1',
  slug: 'full-30',
  title: 'Full 30',
  description: null,
  category: 'full_body',
  cover_path: null,
  duration_minutes: 30,
  difficulty: 2,
  min_tier: 'basic',
  search_tsv: '',
  deleted_at: null,
  created_at: '',
  updated_at: '',
};

describe('WorkoutsTable', () => {
  it('пусто', () => {
    render(<WorkoutsTable rows={[]} />);
    expect(screen.getByText('Тренировок не найдено')).toBeTruthy();
  });

  it('рендерит + клик', () => {
    const onClick = vi.fn();
    render(<WorkoutsTable rows={[ROW]} onRowClick={onClick} />);
    expect(screen.getByText('Full 30')).toBeTruthy();
    expect(screen.getByText('Всё тело')).toBeTruthy();
    expect(screen.getByText('30 мин')).toBeTruthy();
    fireEvent.click(screen.getByTestId('workout-row'));
    expect(onClick).toHaveBeenCalledWith(ROW);
  });
});
