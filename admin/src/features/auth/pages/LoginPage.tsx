import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInAdmin, FORBIDDEN_NOT_ADMIN } from '../api/signInAdmin';
import { useAuthStore } from '../store/auth.store';
import { useAdminSession } from '../hooks/useAdminSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const schema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  useAdminSession();
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (status === 'authenticated') {
    return <Navigate to="/users" replace />;
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const { session, profile } = await signInAdmin(values.email, values.password);
      const store = useAuthStore.getState();
      store.setSession(session);
      store.setProfile(profile);
      store.setStatus('authenticated');
      navigate('/users', { replace: true });
    } catch (err) {
      const message =
        err instanceof Error && err.name === FORBIDDEN_NOT_ADMIN
          ? 'Этот аккаунт не админ. Доступ запрещён.'
          : err instanceof Error
            ? err.message
            : 'Ошибка входа';
      toast({ title: 'Не удалось войти', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Fitness Admin</h1>
          <p className="text-sm text-muted-foreground">Войти с правами администратора</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Входим…' : 'Войти'}
        </Button>
      </form>
    </div>
  );
}
