import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ProgramsTable } from './ProgramsTable';
import type { Program } from '@/types/content';

const ROW: Program = {
  id: 'p1',
  slug: 'strength-4',
  title: 'Сила 4 нед',
  description: null,
  cover_path: null,
  weeks: 4,
  sessions_per_week: 3,
  difficulty: 3,
  min_tier: 'pro',
  created_at: '',
  updated_at: '',
};

describe('ProgramsTable', () => {
  it('пусто', () => {
    render(<ProgramsTable rows={[]} />);
    expect(screen.getByText('Программы не найдены')).toBeTruthy();
  });

  it('рендерит и реагирует на клик', () => {
    const onClick = vi.fn();
    render(<ProgramsTable rows={[ROW]} onRowClick={onClick} />);
    expect(screen.getByText('Сила 4 нед')).toBeTruthy();
    expect(screen.getByText('Pro')).toBeTruthy();
    fireEvent.click(screen.getByTestId('program-row'));
    expect(onClick).toHaveBeenCalledWith(ROW);
  });
});
