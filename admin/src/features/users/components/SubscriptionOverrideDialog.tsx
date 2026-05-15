import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  STATUSES,
  STATUS_LABELS,
  TIERS,
  TIER_LABELS,
  type Profile,
  type SubscriptionStatus,
  type SubscriptionTier,
} from '@/types/shared';
import { toIsoDateInput } from '@/lib/formatDate';
import { useOverrideSubscription } from '../hooks/useOverrideSubscription';
import { toast } from '@/components/ui/use-toast';

const schema = z.object({
  tier: z.enum(['free', 'basic', 'pro', 'pro_max'] as [SubscriptionTier, ...SubscriptionTier[]]),
  status: z.enum([
    'active',
    'in_grace_period',
    'in_billing_retry',
    'paused',
    'expired',
    'cancelled',
    'unknown',
  ] as [SubscriptionStatus, ...SubscriptionStatus[]]),
  expiresAt: z.string().optional(),
  willRenew: z.boolean(),
  note: z.string().min(3, 'Минимум 3 символа'),
});

export type SubscriptionOverrideFormValues = z.infer<typeof schema>;

export interface SubscriptionOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile;
}

export function SubscriptionOverrideDialog({
  open,
  onOpenChange,
  user,
}: SubscriptionOverrideDialogProps) {
  const mutation = useOverrideSubscription();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SubscriptionOverrideFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tier: user.subscription_tier ?? 'free',
      status: user.subscription_status ?? 'unknown',
      expiresAt: toIsoDateInput(user.subscription_expires_at),
      willRenew: user.subscription_will_renew ?? false,
      note: '',
    },
  });

  const tierValue = form.watch('tier');

  // tier=free → expiresAt=null, willRenew=false (forced)
  useEffect(() => {
    if (tierValue === 'free') {
      form.setValue('expiresAt', '');
      form.setValue('willRenew', false);
    }
  }, [tierValue, form]);

  async function onSubmit(values: SubscriptionOverrideFormValues) {
    setServerError(null);
    try {
      const expiresIso = values.expiresAt ? new Date(values.expiresAt).toISOString() : null;
      await mutation.mutateAsync({
        userId: user.id,
        tier: values.tier,
        status: values.status,
        expiresAt: values.tier === 'free' ? null : expiresIso,
        willRenew: values.tier === 'free' ? false : values.willRenew,
        note: values.note,
      });
      toast({
        title: 'Подписка обновлена',
        description: TIER_LABELS[values.tier],
        variant: 'success',
      });
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось обновить подписку';
      setServerError(msg);
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изменить подписку вручную</DialogTitle>
          <DialogDescription>{user.email ?? user.display_name ?? user.id}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tier</Label>
              <Select
                value={form.watch('tier')}
                onValueChange={(v) => form.setValue('tier', v as SubscriptionTier)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIER_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(v) => form.setValue('status', v as SubscriptionStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Истекает</Label>
              <Input
                id="expiresAt"
                type="date"
                disabled={tierValue === 'free'}
                {...form.register('expiresAt')}
              />
            </div>

            <div className="space-y-2 flex flex-col">
              <Label className="mb-1">Возобновится</Label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.watch('willRenew')}
                  disabled={tierValue === 'free'}
                  onChange={(e) => form.setValue('willRenew', e.target.checked)}
                />
                Автопродление включено
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Примечание (обязательно)</Label>
            <Textarea id="note" rows={3} {...form.register('note')} />
            {form.formState.errors.note && (
              <p className="text-xs text-destructive">{form.formState.errors.note.message}</p>
            )}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Сохраняем…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
