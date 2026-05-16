import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BlogPostsTable } from './BlogPostsTable';
import type { BlogPostListRow } from '../api/listBlogPosts';

const ROW: BlogPostListRow = {
  id: 'p1',
  author_id: 'u1',
  slug: 'hello',
  title: 'Hello',
  body: '# h',
  excerpt: null,
  cover_path: null,
  published_at: '2026-05-16T10:00:00Z',
  created_at: '2026-05-16T10:00:00Z',
  updated_at: '2026-05-16T10:00:00Z',
  author: { id: 'u1', display_name: 'Тренер', email: 'a@b.c' },
};

describe('BlogPostsTable', () => {
  it('пустой список', () => {
    render(<BlogPostsTable rows={[]} />);
    expect(screen.getByText('Постов не найдено')).toBeTruthy();
  });

  it('опубликован — Badge "Опубликован"', () => {
    render(<BlogPostsTable rows={[ROW]} />);
    // "Опубликован" — в badge ячейки, "Опубликован" — в header колонки даты
    expect(screen.getAllByText('Опубликован').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('draft — Badge "Draft"', () => {
    render(<BlogPostsTable rows={[{ ...ROW, published_at: null }]} />);
    expect(screen.getByText('Draft')).toBeTruthy();
  });

  it('onRowClick', () => {
    const onClick = vi.fn();
    render(<BlogPostsTable rows={[ROW]} onRowClick={onClick} />);
    fireEvent.click(screen.getByTestId('blog-row'));
    expect(onClick).toHaveBeenCalledWith(ROW);
  });
});
