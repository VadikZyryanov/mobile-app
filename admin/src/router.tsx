import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { UsersListPage } from '@/features/users/pages/UsersListPage';
import { AppShell } from '@/components/shared/AppShell';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Loader2 } from 'lucide-react';

const FoodsListPage = lazy(() =>
  import('@/features/foods/pages/FoodsListPage').then((m) => ({ default: m.FoodsListPage })),
);
const BlogListPage = lazy(() =>
  import('@/features/blog/pages/BlogListPage').then((m) => ({ default: m.BlogListPage })),
);
const ExercisesListPage = lazy(() =>
  import('@/features/exercises/pages/ExercisesListPage').then((m) => ({
    default: m.ExercisesListPage,
  })),
);
const WorkoutsListPage = lazy(() =>
  import('@/features/workouts/pages/WorkoutsListPage').then((m) => ({
    default: m.WorkoutsListPage,
  })),
);
const ProgramsListPage = lazy(() =>
  import('@/features/programs/pages/ProgramsListPage').then((m) => ({
    default: m.ProgramsListPage,
  })),
);
const MetricsPage = lazy(() =>
  import('@/features/metrics/pages/MetricsPage').then((m) => ({ default: m.MetricsPage })),
);
const AuditLogPage = lazy(() =>
  import('@/features/audit/pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
);

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

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
      {
        path: 'exercises',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExercisesListPage />
          </Suspense>
        ),
      },
      {
        path: 'workouts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <WorkoutsListPage />
          </Suspense>
        ),
      },
      {
        path: 'programs',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProgramsListPage />
          </Suspense>
        ),
      },
      {
        path: 'blog',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BlogListPage />
          </Suspense>
        ),
      },
      {
        path: 'foods',
        element: (
          <Suspense fallback={<PageLoader />}>
            <FoodsListPage />
          </Suspense>
        ),
      },
      {
        path: 'metrics',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MetricsPage />
          </Suspense>
        ),
      },
      {
        path: 'audit-log',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AuditLogPage />
          </Suspense>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
