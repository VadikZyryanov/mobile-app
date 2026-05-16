import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, RotateCcw, Trash2 } from 'lucide-react';
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
  WORKOUT_CATEGORIES,
  WORKOUT_CATEGORY_LABELS,
  type SubscriptionTier,
  type Workout,
  type WorkoutCategory,
} from '@/types/content';
import { useWorkoutDetail } from '../hooks/useWorkoutDetail';
import { useDeleteWorkout, useRestoreWorkout, useSaveWorkout } from '../hooks/useWorkoutMutations';
import { WorkoutExercisesBuilder, type BuilderRow, makeUid } from './WorkoutExercisesBuilder';

const TIER_VALUES = TIER_OPTIONS as readonly SubscriptionTier[];
const CATEGORY_VALUES = WORKOUT_CATEGORIES as readonly WorkoutCategory[];

const schema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Только латиница, цифры, дефис'),
  title: z.string().min(2),
  description: z.string().optional(),
  category: z.enum(CATEGORY_VALUES as [WorkoutCategory, ...WorkoutCategory[]]),
  cover_path: z.string().nullable().optional(),
  duration_minutes: z.coerce.number().int().min(1).max(360),
  difficulty: z.coerce.number().int().min(1).max(5),
  min_tier: z.enum(TIER_VALUES as [SubscriptionTier, ...SubscriptionTier[]]),
});

export type WorkoutFormValues = z.infer<typeof schema>;

export interface WorkoutFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout?: Workout | null;
}

const DEFAULTS: WorkoutFormValues = {
  slug: '',
  title: '',
  description: '',
  category: 'full_body',
  cover_path: null,
  duration_minutes: 30,
  difficulty: 2,
  min_tier: 'basic',
};

export function WorkoutFormDialog({ open, onOpenChange, workout }: WorkoutFormDialogProps) {
  const isEdit = !!workout;
  const { data: detail, isLoading: detailLoading } = useWorkoutDetail(
    isEdit && open ? workout?.id : undefined,
  );
  const saveMut = useSaveWorkout();
  const deleteMut = useDeleteWorkout();
  const restoreMut = useRestoreWorkout();
  const pending = saveMut.isPending || deleteMut.isPending || restoreMut.isPending;
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmKind, setConfirmKind] = useState<'delete' | 'restore' | null>(null);
  const [exercises, setExercises] = useState<BuilderRow[]>([]);

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      form.reset(DEFAULTS);
      setExercises([]);
      setServerError(null);
      return;
    }
    if (!workout) return;
    form.reset({
      slug: workout.slug,
      title: workout.title,
      description: workout.description ?? '',
      category: workout.category,
      cover_path: workout.cover_path,
      duration_minutes: workout.duration_minutes,
      difficulty: workout.difficulty,
      min_tier: workout.min_tier,
    });
    setServerError(null);
  }, [open, workout, isEdit, form]);

  useEffect(() => {
    if (!open || !isEdit || !detail) return;
    setExercises(
      detail.workout_exercises.map((e) => ({
        uid: makeUid(),
        exercise_id: e.exercise_id,
        exercise: e.exercise
          ? { id: e.exercise.id, name: e.exercise.name, slug: e.exercise.slug }
          : null,
        sets: e.sets,
        reps: e.reps,
        rest_seconds: e.rest_seconds,
        notes: e.notes ?? '',
      })),
    );
  }, [open, isEdit, detail]);

  async function onSubmit(values: WorkoutFormValues) {
    setServerError(null);
    const missing = exercises.findIndex((e) => !e.exercise_id);
    if (missing >= 0) {
      setServerError(`В упражнении #${missing + 1} не выбрано упражнение`);
      return;
    }
    try {
      await saveMut.mutateAsync({
        workout: {
          id: workout?.id,
          slug: values.slug,
          title: values.title,
          description: values.description?.trim() ? values.description.trim() : null,
          category: values.category,
          cover_path: values.cover_path ?? null,
          duration_minutes: values.duration_minutes,
          difficulty: values.difficulty,
          min_tier: values.min_tier,
        },
        exercises: exercises.map((e) => ({
          exercise_id: e.exercise_id as string,
          sets: e.sets,
          reps: e.reps,
          rest_seconds: e.rest_seconds,
          notes: e.notes?.trim() ? e.notes.trim() : null,
        })),
      });
      toast({
        title: isEdit ? 'Тренировка обновлена' : 'Тренировка создана',
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
  const showLoader = isEdit && detailLoading && exercises.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать тренировку' : 'Новая тренировка'}</DialogTitle>
          <DialogDescription>
            Атомарное сохранение через RPC admin_save_workout_with_exercises
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
                <Input id="slug" {...form.register('slug')} placeholder="full-body-30" />
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Название</Label>
                <Input id="title" {...form.register('title')} placeholder="Full Body 30 мин" />
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
                <Label>Категория</Label>
                <Select
                  value={form.watch('category')}
                  onValueChange={(v) => form.setValue('category', v as WorkoutCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKOUT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {WORKOUT_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Длительность (мин)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={360}
                  {...form.register('duration_minutes')}
                />
                {form.formState.errors.duration_minutes && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.duration_minutes.message}
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
              bucket="workout-covers"
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

            <WorkoutExercisesBuilder value={exercises} onChange={setExercises} />

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}

            <DialogFooter className="sm:justify-between">
              <div>
                {isEdit && workout ? (
                  <Button
                    type="button"
                    variant={workout.deleted_at ? 'outline' : 'ghost'}
                    size="sm"
                    className={workout.deleted_at ? '' : 'text-destructive'}
                    onClick={() => setConfirmKind(workout.deleted_at ? 'restore' : 'delete')}
                    disabled={pending}
                  >
                    {workout.deleted_at ? (
                      <RotateCcw className="h-4 w-4 mr-1" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    {workout.deleted_at ? 'Восстановить' : 'Удалить'}
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
          open={!!confirmKind}
          onOpenChange={(o) => !o && setConfirmKind(null)}
          title={confirmKind === 'delete' ? 'Удалить тренировку?' : 'Восстановить тренировку?'}
          description={workout ? `${workout.title} (${workout.slug})` : undefined}
          confirmLabel={confirmKind === 'delete' ? 'Удалить' : 'Восстановить'}
          variant={confirmKind === 'delete' ? 'destructive' : 'default'}
          onConfirm={async () => {
            if (!workout || !confirmKind) return;
            try {
              if (confirmKind === 'delete') {
                await deleteMut.mutateAsync(workout.id);
                toast({ title: 'Тренировка удалена', variant: 'success' });
              } else {
                await restoreMut.mutateAsync(workout.id);
                toast({ title: 'Тренировка восстановлена', variant: 'success' });
              }
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
