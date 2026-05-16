import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { createTestQueryClient } from '../../../../tests/utils/renderWithProviders';

vi.mock('../hooks/useMetrics', () => ({
  useRegistrationsDaily: () => ({
    isLoading: false,
    data: [{ day: '2026-05-01', new_users: 3 }],
  }),
  useSubscriptionEventsDaily: () => ({ isLoading: false, data: [] }),
  useTierDistribution: () => ({
    isLoading: false,
    data: [{ tier: 'free', count: 100 }],
  }),
  useActiveSubs: () => ({
    isLoading: false,
    data: [
      { tier: 'basic', count: 10 },
      { tier: 'pro', count: 5 },
    ],
  }),
  useContentStats: () => ({
    isLoading: false,
    data: {
      exercises_count: 42,
      workouts_count: 10,
      programs_count: 5,
      blog_posts_count: 8,
      foods_count: 74,
      total_users: 115,
    },
  }),
}));

// recharts needs ResizeObserver in JSDOM
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

import { MetricsPage } from './MetricsPage';

function createWrapper() {
  const client: QueryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client },
      createElement(MemoryRouter, null, children),
    );
  };
}

describe('MetricsPage', () => {
  it('рендерит заголовок и KPI-карточки', () => {
    render(<MetricsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Метрики')).toBeDefined();
    expect(screen.getByText('Активных подписок')).toBeDefined();
    expect(screen.getByText('Всего пользователей')).toBeDefined();
  });

  it('показывает контент-статистику', () => {
    render(<MetricsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Упражнения')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
  });

  it('рендерит period-кнопки', () => {
    render(<MetricsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('7 дней')).toBeDefined();
    expect(screen.getByText('30 дней')).toBeDefined();
    expect(screen.getByText('90 дней')).toBeDefined();
  });
});
