import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuditTable } from './AuditTable';
import { AuditDiffDialog } from './AuditDiffDialog';
import type { AuditLogRow } from '../api/listAuditLog';

const row: AuditLogRow = {
  id: 'r1',
  action: 'food.create',
  entity_type: 'food',
  entity_id: '11111111-0000-0000-0000-000000000000',
  before: null,
  after: { name: 'Гречка' },
  note: null,
  created_at: '2026-05-16T10:00:00Z',
  admin: { display_name: 'Admin', email: 'admin@x.com' },
  target_user: null,
};

describe('AuditTable', () => {
  it('рендерит строку с action', () => {
    render(<AuditTable rows={[row]} />);
    expect(screen.getByText('food.create')).toBeDefined();
    expect(screen.getByText('Admin')).toBeDefined();
  });

  it('показывает "Записей нет" при пустом массиве', () => {
    render(<AuditTable rows={[]} />);
    expect(screen.getByText('Записей нет')).toBeDefined();
  });

  it('открывает diff dialog по клику на Diff', () => {
    render(<AuditTable rows={[row]} />);
    fireEvent.click(screen.getByText('Diff'));
    expect(screen.getByText('Diff: food.create')).toBeDefined();
  });
});

describe('AuditDiffDialog', () => {
  it('отображает before и after', () => {
    render(
      <AuditDiffDialog
        open
        onOpenChange={vi.fn()}
        action="workout.update"
        before={{ name: 'Old' }}
        after={{ name: 'New' }}
      />,
    );
    expect(screen.getByText(/Old/)).toBeDefined();
    expect(screen.getByText(/New/)).toBeDefined();
  });

  it('показывает note если передан', () => {
    render(
      <AuditDiffDialog
        open
        onOpenChange={vi.fn()}
        action="x"
        before={null}
        after={null}
        note="ручной override"
      />,
    );
    expect(screen.getByText('ручной override')).toBeDefined();
  });
});
