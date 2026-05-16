import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCard } from './KpiCard';
import { ContentStatsGrid } from './ContentStatsGrid';

describe('KpiCard', () => {
  it('отображает label и value', () => {
    render(<KpiCard label="MRR" value="$149.70" sub="est." />);
    expect(screen.getByText('MRR')).toBeDefined();
    expect(screen.getByText('$149.70')).toBeDefined();
    expect(screen.getByText('est.')).toBeDefined();
  });

  it('не рендерит sub если не передан', () => {
    const { queryByText } = render(<KpiCard label="X" value={42} />);
    expect(queryByText('est.')).toBeNull();
  });
});

describe('ContentStatsGrid', () => {
  it('отображает все 6 карточек', () => {
    const stats = {
      exercises_count: 10,
      workouts_count: 5,
      programs_count: 2,
      blog_posts_count: 3,
      foods_count: 74,
      total_users: 100,
    };
    render(<ContentStatsGrid data={stats} />);
    expect(screen.getByText('Упражнения')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('Пользователи')).toBeDefined();
    expect(screen.getByText('100')).toBeDefined();
  });
});
