import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { UsersListPage } from '@/features/users/pages/UsersListPage';
import { FoodsListPage } from '@/features/foods/pages/FoodsListPage';
import { AppShell } from '@/components/shared/AppShell';
import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/users" replace /> },
      { path: 'users', element: <UsersListPage /> },
      { path: 'users/:id', element: <UsersListPage /> },
      { path: 'exercises', element: <PlaceholderPage title="Упражнения" /> },
      { path: 'exercises/:id', element: <PlaceholderPage title="Упражнения" /> },
      { path: 'workouts', element: <PlaceholderPage title="Тренировки" /> },
      { path: 'workouts/:id', element: <PlaceholderPage title="Тренировки" /> },
      { path: 'programs', element: <PlaceholderPage title="Программы" /> },
      { path: 'programs/:id', element: <PlaceholderPage title="Программы" /> },
      { path: 'blog', element: <PlaceholderPage title="Блог" /> },
      { path: 'blog/:id', element: <PlaceholderPage title="Блог" /> },
      { path: 'foods', element: <FoodsListPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
