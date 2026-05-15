import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { UsersTable } from './UsersTable';
import { renderWithProviders } from '../../../../tests/utils/renderWithProviders';
import type { UserListRow } from '../api/listUsers';

const rows: UserListRow[] = [
  {
    id: '1',
    email: 'one@mail.ru',
    display_name: 'Alice',
    subscription_tier: 'pro',
    subscription_status: 'active',
    subscription_expires_at: '2026-06-01T00:00:00Z',
    subscription_will_renew: true,
    is_admin: false,
    created_at: '2026-05-01T00:00:00Z',
  },
];

describe('UsersTable', () => {
  it('рендерит строки', () => {
    renderWithProviders(<UsersTable rows={rows} />);
    expect(screen.getByText('one@mail.ru')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('loading → показывает skeletons', () => {
    renderWithProviders(<UsersTable rows={[]} loading />);
    expect(screen.queryByText('Пользователей не найдено')).not.toBeInTheDocument();
  });

  it('empty → empty state', () => {
    renderWithProviders(<UsersTable rows={[]} />);
    expect(screen.getByText('Пользователей не найдено')).toBeInTheDocument();
  });
});
