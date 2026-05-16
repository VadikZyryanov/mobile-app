import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  Apple,
  BarChart2,
  Calendar,
  ClipboardList,
  Dumbbell,
  FileText,
  LogOut,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { signOutAdmin } from '@/features/auth/api/signOutAdmin';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/users', label: 'Пользователи', icon: Users },
  { to: '/exercises', label: 'Упражнения', icon: Dumbbell },
  { to: '/workouts', label: 'Тренировки', icon: Activity },
  { to: '/programs', label: 'Программы', icon: Calendar },
  { to: '/blog', label: 'Блог', icon: FileText },
  { to: '/foods', label: 'Продукты', icon: Apple },
  { to: '/metrics', label: 'Метрики', icon: BarChart2 },
  { to: '/audit-log', label: 'Аудит', icon: ClipboardList },
] as const;

export function AppShell() {
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);
  const navigate = useNavigate();

  async function handleLogout() {
    await signOutAdmin();
    reset();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr] bg-slate-50">
      <aside className="border-r bg-white p-4 flex flex-col">
        <div className="mb-6">
          <p className="text-lg font-semibold">Fitness Admin</p>
          <p className="text-xs text-muted-foreground truncate">{profile?.email ?? ''}</p>
        </div>

        <nav className="space-y-1 flex-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-100',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <Separator className="my-3" />
        <Button variant="ghost" size="sm" onClick={handleLogout} className="justify-start">
          <LogOut className="h-4 w-4 mr-2" />
          Выйти
        </Button>
      </aside>

      <main className="overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
