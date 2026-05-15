import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TierBadge } from '@/components/shared/TierBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate, formatDateTime } from '@/lib/formatDate';
import { useUser } from '../hooks/useUser';
import { SubscriptionOverrideDialog } from './SubscriptionOverrideDialog';

interface UserDetailDrawerProps {
  userId: string | undefined;
}

export function UserDetailDrawer({ userId }: UserDetailDrawerProps) {
  const open = Boolean(userId);
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useUser(userId);
  const [overrideOpen, setOverrideOpen] = useState(false);

  function close() {
    navigate('/users');
  }

  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? close() : null)}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Пользователь</SheetTitle>
        </SheetHeader>

        {isLoading && <p className="mt-4 text-sm text-muted-foreground">Загрузка…</p>}
        {isError && <p className="mt-4 text-sm text-destructive">Ошибка загрузки</p>}

        {user && (
          <div className="mt-4 space-y-6">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Профиль</h3>
              <Row label="Имя">{user.display_name ?? '—'}</Row>
              <Row label="Email">{user.email ?? '—'}</Row>
              <Row label="ID">
                <code className="text-xs">{user.id}</code>
              </Row>
              <Row label="Админ">{user.is_admin ? 'Да' : 'Нет'}</Row>
              <Row label="Создан">{formatDateTime(user.created_at)}</Row>
            </section>

            <Separator />

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Подписка</h3>
              <Row label="Tier">
                <TierBadge tier={user.subscription_tier} />
              </Row>
              <Row label="Статус">
                <StatusBadge status={user.subscription_status} />
              </Row>
              <Row label="Истекает">{formatDate(user.subscription_expires_at)}</Row>
              <Row label="Автопродление">{user.subscription_will_renew ? '✓' : '—'}</Row>
              <Row label="Product ID">{user.subscription_product_id ?? '—'}</Row>
              <Row label="RC user ID">{user.revenuecat_app_user_id ?? '—'}</Row>
              <Row label="Обновлено">{formatDateTime(user.subscription_updated_at)}</Row>
              <Row label="Примечание override">{user.subscription_override_note ?? '—'}</Row>

              <Button className="w-full mt-2" onClick={() => setOverrideOpen(true)}>
                Изменить подписку вручную
              </Button>
            </section>

            {overrideOpen && (
              <SubscriptionOverrideDialog
                open={overrideOpen}
                onOpenChange={setOverrideOpen}
                user={user}
              />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
