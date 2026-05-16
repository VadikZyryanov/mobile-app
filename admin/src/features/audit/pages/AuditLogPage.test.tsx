import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { createTestQueryClient } from '../../../../tests/utils/renderWithProviders';

vi.mock('../hooks/useAuditLog', () => ({
  useAuditLog: () => ({ isLoading: false, data: { rows: [], total: 0 } }),
}));

import { AuditLogPage } from './AuditLogPage';

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

describe('AuditLogPage', () => {
  it('рендерит заголовок и пустую таблицу', () => {
    render(<AuditLogPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Аудит лог')).toBeDefined();
    expect(screen.getByText('Записей нет')).toBeDefined();
  });
});
