import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the entire supabase module
// Chain without action:   from → select → order → range
// Chain with action:      from → select → ilike → order → range
const mockRange = vi.fn();
const mockOrder = vi.fn(() => ({ range: mockRange }));
const mockIlike = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ ilike: mockIlike, order: mockOrder }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (table: string) => (mockFrom as any)(table) },
}));

import { listAuditLog } from './listAuditLog';

beforeEach(() => {
  mockFrom.mockClear();
  mockSelect.mockClear();
  mockIlike.mockClear();
  mockOrder.mockClear();
  mockRange.mockReset();
});

describe('listAuditLog', () => {
  it('запрашивает admin_audit_log без фильтра', async () => {
    mockRange.mockResolvedValueOnce({ data: [], count: 0, error: null });
    const result = await listAuditLog({ offset: 0, limit: 20 });
    expect(mockFrom).toHaveBeenCalledWith('admin_audit_log');
    expect(result).toEqual({ rows: [], total: 0 });
  });

  it('применяет ilike-фильтр при наличии action', async () => {
    mockRange.mockResolvedValueOnce({ data: [], count: 0, error: null });
    await listAuditLog({ offset: 0, limit: 20, action: 'subscription' });
    expect(mockIlike).toHaveBeenCalledWith('action', '%subscription%');
  });

  it('throw при ошибке', async () => {
    mockRange.mockResolvedValueOnce({ data: null, count: null, error: new Error('forbidden') });
    await expect(listAuditLog({ offset: 0, limit: 20 })).rejects.toThrow('forbidden');
  });
});
