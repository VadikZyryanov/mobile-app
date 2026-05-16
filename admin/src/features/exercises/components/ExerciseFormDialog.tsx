import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RotateCcw, Trash2 } from 'lucide-react';
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
  MUSCLE_GROUPS,
  MUSCLE_LABELS,
  TIER_LABELS,
  TIER_OPTIONS,
  type Exercise,
  type MuscleGroup,
  type SubscriptionTier,
} from '@/types/content';
import { MuscleChipsField } from './MuscleChipsField';
import { EquipmentChipsField } from './EquipmentChipsField';
import {
  useCreateExercise,
  useDeleteExercise,
  useRestoreExercise,
  useUpdateExercise,
} from '../hooks/useExerciseMutations';

const MUSCLE_VALUES = MUSCLE_GROUPS as readonly MuscleGroup[];
const TIER_VALUES = TIER_OPTIONS as readonly SubscriptionTier[];

const schema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Только латиница, цифры, дефис'),
  name: z.string().min(2),
  description: z.string().optional(),
  primary_muscle: z.enum(MUSCLE_VALUES as [MuscleGroup, ...MuscleGroup[]]),
  secondary_muscles: z.array(z.enum(MUSCLE_VALUES as [MuscleGroup, ...MuscleGroup[]])),
  equipment: z.array(z.string()),
  gif_path: z.string().nullable().optional(),
  video_path: z.string().nullable().optional(),
  min_tier: z.enum(TIER_VALUES as [SubscriptionTier, ...SubscriptionTier[]]),
});

export type ExerciseFormValues = z.infer<typeof schema>;

export interface ExerciseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise?: Exercise | null;
}

const DEFAULTS: ExerciseFormValues = {
  slug: '',
  name: '',
  description: '',
  primary_muscle: 'chest',
  secondary_muscles: [],
  equipment: [],
  gif_path: null,
  video_path: null,
  min_tier: 'free',
};

export function ExerciseFormDialog({ open, onOpenChange, exercise }: ExerciseFormDialogProps) {
  const isEdit = !!exercise;
  const createMut = useCreateExercise();
  const updateMut = useUpdateExercise();
  const deleteMut = useDeleteExercise();
  const restoreMut = useRestoreExercise();
  const pending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending || restoreMut.isPending;
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmKind, setConfirmKind] = useState<'delete' | 'restore' | null>(null);

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        exercise
          ? {
              slug: exercise.slug,
              name: exercise.name,
              description: exercise.description ?? '',
              primary_muscle: exercise.primary_muscle,
              secondary_muscles: exercise.secondary_muscles ?? [],
              equipment: exercise.equipment ?? [],
              gif_path: exercise.gif_path,
              video_path: exercise.video_path,
              min_tier: exercise.min_tier,
            }
          : DEFAULTS,
      );
      setServerError(null);
    }
  }, [open, exercise, form]);

  async function onSubmit(values: ExerciseFormValues) {
    setServerError(null);
    const payload = {
      slug: values.slug,
      name: values.name,
      description: values.description?.trim() ? values.description.trim() : null,
      primary_muscle: values.primary_muscle,
      secondary_muscles: values.secondary_muscles.filter((m) => m !== values.primary_muscle),
      equipment: values.equipment,
      gif_path: values.gif_path ?? null,
      video_path: values.video_path ?? null,
      min_tier: values.min_tier,
    };
    try {
      if (isEdit && exercise) {
        await updateMut.mutateAsync({ id: exercise.id, patch: payload });
        toast({ title: 'Упражнение обновлено', variant: 'success' });
      } else {
        await createMut.mutateAsync(payload);
        toast({ title: 'Упражнение создано', variant: 'success' });
      }
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось сохранить';
      setServerError(msg);
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    }
  }

  const primaryMuscle = form.watch('primary_muscle');
  const secondary = form.watch('secondary_muscles');
  const equipment = form.watch('equipment');
  const gifPath = form.watch('gif_path');
  const videoPath = form.watch('video_path');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать упражнение' : 'Новое упражнение'}</DialogTitle>
          <DialogDescription>GIF и видео загружаются в bucket exercise-media</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" placeholder="bench-press" {...form.register('slug')} />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input id="name" placeholder="Жим лёжа" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Техника / описание</Label>
            <Textarea id="description" rows={3} {...form.register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Основная мышца</Label>
              <Select
                value={primaryMuscle}
                onValueChange={(v) => form.setValue('primary_muscle', v as MuscleGroup)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MUSCLE_LABELS[m]}
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

          <MuscleChipsField
            label="Дополнительные мышцы"
            value={secondary}
            exclude={primaryMuscle}
            onChange={(v) => form.setValue('secondary_muscles', v)}
          />

          <EquipmentChipsField
            label="Оборудование"
            value={equipment}
            onChange={(v) => form.setValue('equipment', v)}
          />

          <div className="grid grid-cols-2 gap-4">
            <FileUpload
              label="GIF превью"
              bucket="exercise-media"
              pathPrefix="gifs"
              value={gifPath}
              onChange={(v) => form.setValue('gif_path', v)}
              accept="image/gif"
              maxSizeMB={10}
              kind="gif"
              onError={(m) =>
                toast({ title: 'Ошибка загрузки', description: m, variant: 'destructive' })
              }
            />
            <FileUpload
              label="Видео"
              bucket="exercise-media"
              pathPrefix="videos"
              value={videoPath}
              onChange={(v) => form.setValue('video_path', v)}
              accept="video/mp4"
              maxSizeMB={50}
              kind="video"
              onError={(m) =>
                toast({ title: 'Ошибка загрузки', description: m, variant: 'destructive' })
              }
            />
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <DialogFooter className="sm:justify-between">
            <div>
              {isEdit && exercise ? (
                <Button
                  type="button"
                  variant={exercise.deleted_at ? 'outline' : 'ghost'}
                  size="sm"
                  className={exercise.deleted_at ? '' : 'text-destructive'}
                  onClick={() => setConfirmKind(exercise.deleted_at ? 'restore' : 'delete')}
                  disabled={pending}
                >
                  {exercise.deleted_at ? (
                    <RotateCcw className="h-4 w-4 mr-1" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  {exercise.deleted_at ? 'Восстановить' : 'Удалить'}
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

        <ConfirmDialog
          open={!!confirmKind}
          onOpenChange={(o) => !o && setConfirmKind(null)}
          title={confirmKind === 'delete' ? 'Удалить упражнение?' : 'Восстановить упражнение?'}
          description={exercise ? `${exercise.name} (${exercise.slug})` : undefined}
          confirmLabel={confirmKind === 'delete' ? 'Удалить' : 'Восстановить'}
          variant={confirmKind === 'delete' ? 'destructive' : 'default'}
          onConfirm={async () => {
            if (!exercise || !confirmKind) return;
            try {
              if (confirmKind === 'delete') {
                await deleteMut.mutateAsync(exercise.id);
                toast({ title: 'Упражнение удалено', variant: 'success' });
              } else {
                await restoreMut.mutateAsync(exercise.id);
                toast({ title: 'Упражнение восстановлено', variant: 'success' });
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
