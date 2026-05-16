import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { UsersListPage } from '@/features/users/pages/UsersListPage';
import { FoodsListPage } from '@/features/foods/pages/FoodsListPage';
import { BlogListPage } from '@/features/blog/pages/BlogListPage';
import { ExercisesListPage } from '@/features/exercises/pages/ExercisesListPage';
import { WorkoutsListPage } from '@/features/workouts/pages/WorkoutsListPage';
import { ProgramsListPage } from '@/features/programs/pages/ProgramsListPage';
import { AppShell } from '@/components/shared/AppShell';
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
      { path: 'exercises', element: <ExercisesListPage /> },
      { path: 'workouts', element: <WorkoutsListPage /> },
      { path: 'programs', element: <ProgramsListPage /> },
      { path: 'blog', element: <BlogListPage /> },
      { path: 'foods', element: <FoodsListPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
