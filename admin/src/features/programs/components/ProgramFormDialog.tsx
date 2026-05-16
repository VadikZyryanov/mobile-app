import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUpload } from '@/components/ui/FileUpload';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { toast } from '@/components/ui/use-toast';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_LEVELS,
  TIER_LABELS,
  TIER_OPTIONS,
  type Program,
  type SubscriptionTier,
} from '@/types/content';
import { useProgramDetail } from '../hooks/useProgramDetail';
import { useDeleteProgram, useSaveProgram } from '../hooks/useProgramMutations';
import {
  ProgramScheduleBuilder,
  scheduleKey,
  scheduleToArray,
  type ScheduleMap,
} from './ProgramScheduleBuilder';

const TIER_VALUES = TIER_OPTIONS as readonly SubscriptionTier[];

const schema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Только латиница, цифры, дефис'),
  title: z.string().min(2),
  description: z.string().optional(),
  cover_path: z.string().nullable().optional(),
  weeks: z.coerce.number().int().min(1).max(52),
  sessions_per_week: z.coerce.number().int().min(1).max(7),
  difficulty: z.coerce.number().int().min(1).max(5),
  min_tier: z.enum(TIER_VALUES as [SubscriptionTier, ...SubscriptionTier[]]),
});

export type ProgramFormValues = z.infer<typeof schema>;

export interface ProgramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: Program | null;
}

const DEFAULTS: ProgramFormValues = {
  slug: '',
  title: '',
  description: '',
  cover_path: null,
  weeks: 4,
  sessions_per_week: 3,
  difficulty: 2,
  min_tier: 'pro',
};

export function ProgramFormDialog({ open, onOpenChange, program }: ProgramFormDialogProps) {
  const isEdit = !!program;
  const { data: detail, isLoading: detailLoading } = useProgramDetail(
    isEdit && open ? program?.id : undefined,
  );
  const saveMut = useSaveProgram();
  const deleteMut = useDeleteProgram();
  const pending = saveMut.isPending || deleteMut.isPending;
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleMap>({});
  const [pendingShrink, setPendingShrink] = useState<number | null>(null);

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      form.reset(DEFAULTS);
      setSchedule({});
      setServerError(null);
      return;
    }
    if (!program) return;
    form.reset({
      slug: program.slug,
      title: program.title,
      description: program.description ?? '',
      cover_path: program.cover_path,
      weeks: program.weeks,
      sessions_per_week: program.sessions_per_week,
      difficulty: program.difficulty,
      min_tier: program.min_tier,
    });
    setServerError(null);
  }, [open, program, isEdit, form]);

  useEffect(() => {
    if (!open || !isEdit || !detail) return;
    const next: ScheduleMap = {};
    detail.program_workouts.forEach((p) => {
      next[scheduleKey(p.week, p.day_of_week)] = {
        workout_id: p.workout_id,
        workout: p.workout
          ? { id: p.workout.id, title: p.workout.title, slug: p.workout.slug }
          : null,
      };
    });
    setSchedule(next);
  }, [open, isEdit, detail]);

  const weeksValue = form.watch('weeks');

  function changeWeeks(newWeeks: number) {
    // Если уменьшаем и в зоне обрезки есть данные — спросить подтверждение
    const overflow = Object.keys(schedule).some((k) => {
      const w = Number(k.split('-')[0]);
      return w > newWeeks;
    });
    if (overflow) {
      setPendingShrink(newWeeks);
      return;
    }
    form.setValue('weeks', newWeeks);
  }

  function confirmShrink() {
    if (pendingShrink == null) return;
    const newWeeks = pendingShrink;
    const next: ScheduleMap = {};
    Object.entries(schedule).forEach(([k, v]) => {
      const w = Number(k.split('-')[0]);
      if (w <= newWeeks) next[k] = v;
    });
    setSchedule(next);
    form.setValue('weeks', newWeeks);
    setPendingShrink(null);
  }

  async function onSubmit(values: ProgramFormValues) {
    setServerError(null);
    const scheduleArr = scheduleToArray(values.weeks, schedule);
    if (scheduleArr.length === 0) {
      setServerError('Расписание пустое — добавь хотя бы одну тренировку');
      return;
    }
    try {
      await saveMut.mutateAsync({
        program: {
          id: program?.id,
          slug: values.slug,
          title: values.title,
          description: values.description?.trim() ? values.description.trim() : null,
          cover_path: values.cover_path ?? null,
          weeks: values.weeks,
          sessions_per_week: values.sessions_per_week,
          difficulty: values.difficulty,
          min_tier: values.min_tier,
        },
        schedule: scheduleArr,
      });
      toast({
        title: isEdit ? 'Программа обновлена' : 'Программа создана',
        variant: 'success',
      });
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось сохранить';
      setServerError(msg);
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    }
  }

  const coverPath = form.watch('cover_path');
  const showLoader = isEdit && detailLoading && Object.keys(schedule).length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать программу' : 'Новая программа'}</DialogTitle>
          <DialogDescription>
            Атомарное сохранение через RPC admin_save_program_with_workouts
          </DialogDescription>
        </DialogHeader>

        {showLoader ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" {...form.register('slug')} placeholder="strength-4-weeks" />
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input id="title" {...form.register('title')} placeholder="Сила за 4 недели" />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" rows={2} {...form.register('description')} />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weeks">Недель</Label>
                <Input
                  id="weeks"
                  type="number"
                  min={1}
                  max={52}
                  value={weeksValue}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n) && n >= 1) changeWeeks(n);
                  }}
                />
                {form.formState.errors.weeks && (
                  <p className="text-xs text-destructive">{form.formState.errors.weeks.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessions">Сессий/неделя</Label>
                <Input
                  id="sessions"
                  type="number"
                  min={1}
                  max={7}
                  {...form.register('sessions_per_week')}
                />
                {form.formState.errors.sessions_per_week && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.sessions_per_week.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Сложность</Label>
                <Select
                  value={String(form.watch('difficulty'))}
                  onValueChange={(v) => form.setValue('difficulty', Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} — {DIFFICULTY_LABELS[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Мин. тариф</Label>
                <Select
                  value={form.watch('min_tier')}
                  onValueChange={(v) => form.setValue('min_tier', v as SubscriptionTier)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIER_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TIER_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <FileUpload
              label="Обложка"
              bucket="program-covers"
              pathPrefix="covers"
              value={coverPath}
              onChange={(v) => form.setValue('cover_path', v)}
              accept="image/jpeg,image/png,image/webp"
              maxSizeMB={5}
              kind="image"
              onError={(m) =>
                toast({ title: 'Ошибка загрузки', description: m, variant: 'destructive' })
              }
            />

            <ProgramScheduleBuilder
              weeks={weeksValue}
              schedule={schedule}
              onScheduleChange={setSchedule}
            />

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <DialogFooter className="sm:justify-between">
              <div>
                {isEdit && program ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setConfirmDelete(true)}
                    disabled={pending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Удалить
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Сохраняем…' : 'Сохранить'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}

        <ConfirmDialog
          open={pendingShrink != null}
          onOpenChange={(o) => !o && setPendingShrink(null)}
          title="Сократить кол-во недель?"
          description="Удалит назначенные тренировки в обрезаемых неделях."
          confirmLabel="Сократить"
          variant="destructive"
          onConfirm={async () => {
            confirmShrink();
          }}
        />

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Удалить программу?"
          description={
            program ? `${program.title} (${program.slug}). Это действие необратимо.` : undefined
          }
          confirmLabel="Удалить"
          variant="destructive"
          onConfirm={async () => {
            if (!program) return;
            try {
              await deleteMut.mutateAsync(program.id);
              toast({ title: 'Программа удалена', variant: 'success' });
              onOpenChange(false);
            } catch (e) {
              toast({
                title: 'Ошибка',
                description: e instanceof Error ? e.message : 'Не удалось',
                variant: 'destructive',
              });
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
