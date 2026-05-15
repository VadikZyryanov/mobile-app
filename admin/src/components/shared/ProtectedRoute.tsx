import { Navigate } from 'react-router-dom';
import { useAdminSession } from '@/features/auth/hooks/useAdminSession';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status, isAdmin } = useAdminSession();

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Загрузка…
      </div>
    );
  }

  if (status !== 'authenticated' || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
