import { describe, expect, it, vi, beforeEach } from 'vitest';

const rpcMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: (...args: unknown[]) => rpcMock(...args) },
}));

import { logAdminAction } from './audit';

beforeEach(() => rpcMock.mockReset());

describe('logAdminAction', () => {
  it('пишет в admin_log_content_action c составленным action (note опускается, если undefined)', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await logAdminAction('create', 'food', 'id-1', { a: 1 }, { a: 2 });
    expect(rpcMock).toHaveBeenCalledWith('admin_log_content_action', {
      p_action: 'food.create',
      p_entity_type: 'food',
      p_entity_id: 'id-1',
      p_before: { a: 1 },
      p_after: { a: 2 },
    });
  });

  it('передаёт note если задан', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });
    await logAdminAction('delete', 'exercise', 'id-2', null, null, 'soft delete');
    const call = rpcMock.mock.calls[0]![1] as Record<string, unknown>;
    expect(call.p_note).toBe('soft delete');
    expect(call.p_before).toBeNull();
    expect(call.p_after).toBeNull();
  });

  it('throw при ошибке', async () => {
    rpcMock.mockResolvedValueOnce({ error: new Error('forbidden') });
    await expect(logAdminAction('update', 'workout', 'id', {}, {})).rejects.toThrow('forbidden');
  });
});
