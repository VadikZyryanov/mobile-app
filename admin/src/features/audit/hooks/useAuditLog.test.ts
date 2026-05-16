import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { createTestQueryClient } from '../../../../tests/utils/renderWithProviders';

vi.mock('../api/listAuditLog', () => ({
  listAuditLog: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
}));

import { useAuditLog } from './useAuditLog';

function createWrapper() {
  const client: QueryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe('useAuditLog', () => {
  it('возвращает данные', async () => {
    const { result } = renderHook(() => useAuditLog({ offset: 0, limit: 20 }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(0);
  });
});
