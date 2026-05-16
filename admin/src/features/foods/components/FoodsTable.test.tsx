import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FoodsTable } from './FoodsTable';
import type { Food } from '@/types/content';

const ROW: Food = {
  id: 'f1',
  slug: 'chicken',
  name: 'Курица',
  brand: 'Мираторг',
  kcal_per_100g: 165,
  protein_per_100g: 31,
  fat_per_100g: 3.6,
  carbs_per_100g: 0,
  created_at: '',
  updated_at: '',
  deleted_at: null,
};

describe('FoodsTable', () => {
  it('loading — Skeleton, нет таблицы', () => {
    render(<FoodsTable rows={[]} loading />);
    expect(screen.queryByText('Slug')).toBeNull();
  });

  it('empty — показывает EmptyState', () => {
    render(<FoodsTable rows={[]} />);
    expect(screen.getByText('Продукты не найдены')).toBeTruthy();
  });

  it('рендерит строки и вызывает onRowClick', () => {
    const onRowClick = vi.fn();
    render(<FoodsTable rows={[ROW]} onRowClick={onRowClick} />);
    expect(screen.getByText('Курица')).toBeTruthy();
    expect(screen.getByText('chicken')).toBeTruthy();
    fireEvent.click(screen.getByTestId('food-row'));
    expect(onRowClick).toHaveBeenCalledWith(ROW);
  });

  it('soft-deleted row — opacity-50 + бэйдж "Удалён"', () => {
    render(<FoodsTable rows={[{ ...ROW, deleted_at: '2026-05-16' }]} />);
    expect(screen.getByText('Удалён')).toBeTruthy();
    const tr = screen.getByTestId('food-row');
    expect(tr.className).toContain('opacity-50');
  });
});
