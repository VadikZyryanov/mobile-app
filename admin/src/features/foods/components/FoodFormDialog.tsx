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
import { toast } from '@/components/ui/use-toast';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  useCreateFood,
  useDeleteFood,
  useRestoreFood,
  useUpdateFood,
} from '../hooks/useFoodMutations';
import type { Food } from '@/types/content';

const schema = z.object({
  slug: z
    .string()
    .min(2, 'Минимум 2 символа')
    .regex(/^[a-z0-9-]+$/, 'Только латиница, цифры, дефис'),
  name: z.string().min(2, 'Минимум 2 символа'),
  brand: z.string().optional(),
  kcal_per_100g: z.coerce.number().min(0).max(1000),
  protein_per_100g: z.coerce.number().min(0).max(100),
  fat_per_100g: z.coerce.number().min(0).max(100),
  carbs_per_100g: z.coerce.number().min(0).max(100),
});

export type FoodFormValues = z.infer<typeof schema>;

export interface FoodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  food?: Food | null;
}

export function FoodFormDialog({ open, onOpenChange, food }: FoodFormDialogProps) {
  const isEdit = !!food;
  const createMut = useCreateFood();
  const updateMut = useUpdateFood();
  const deleteMut = useDeleteFood();
  const restoreMut = useRestoreFood();
  const pending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending || restoreMut.isPending;
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmKind, setConfirmKind] = useState<'delete' | 'restore' | null>(null);

  const form = useForm<FoodFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: '',
      name: '',
      brand: '',
      kcal_per_100g: 0,
      protein_per_100g: 0,
      fat_per_100g: 0,
      carbs_per_100g: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        food
          ? {
              slug: food.slug,
              name: food.name,
              brand: food.brand ?? '',
              kcal_per_100g: food.kcal_per_100g,
              protein_per_100g: food.protein_per_100g,
              fat_per_100g: food.fat_per_100g,
              carbs_per_100g: food.carbs_per_100g,
            }
          : {
              slug: '',
              name: '',
              brand: '',
              kcal_per_100g: 0,
              protein_per_100g: 0,
              fat_per_100g: 0,
              carbs_per_100g: 0,
            },
      );
      setServerError(null);
    }
  }, [open, food, form]);

  async function onSubmit(values: FoodFormValues) {
    setServerError(null);
    const payload = {
      slug: values.slug,
      name: values.name,
      brand: values.brand?.trim() ? values.brand.trim() : null,
      kcal_per_100g: values.kcal_per_100g,
      protein_per_100g: values.protein_per_100g,
      fat_per_100g: values.fat_per_100g,
      carbs_per_100g: values.carbs_per_100g,
    };
    try {
      if (isEdit && food) {
        await updateMut.mutateAsync({ id: food.id, patch: payload });
        toast({ title: 'Продукт обновлён', variant: 'success' });
      } else {
        await createMut.mutateAsync(payload);
        toast({ title: 'Продукт создан', variant: 'success' });
      }
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось сохранить';
      setServerError(msg);
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать продукт' : 'Новый продукт'}</DialogTitle>
          <DialogDescription>КБЖУ указывается на 100&nbsp;г</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" placeholder="chicken-breast" {...form.register('slug')} />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input id="name" placeholder="Куриная грудка" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Бренд (опционально)</Label>
            <Input id="brand" placeholder="Мираторг" {...form.register('brand')} />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kcal">Ккал</Label>
              <Input
                id="kcal"
                type="number"
                step="0.1"
                min={0}
                {...form.register('kcal_per_100g')}
              />
              {form.formState.errors.kcal_per_100g && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.kcal_per_100g.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Белки</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                min={0}
                {...form.register('protein_per_100g')}
              />
              {form.formState.errors.protein_per_100g && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.protein_per_100g.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Жиры</Label>
              <Input id="fat" type="number" step="0.1" min={0} {...form.register('fat_per_100g')} />
              {form.formState.errors.fat_per_100g && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.fat_per_100g.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Углеводы</Label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                min={0}
                {...form.register('carbs_per_100g')}
              />
              {form.formState.errors.carbs_per_100g && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.carbs_per_100g.message}
                </p>
              )}
            </div>
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <DialogFooter className="sm:justify-between">
            <div>
              {isEdit && food ? (
                <Button
                  type="button"
                  variant={food.deleted_at ? 'outline' : 'ghost'}
                  size="sm"
                  className={food.deleted_at ? '' : 'text-destructive'}
                  onClick={() => setConfirmKind(food.deleted_at ? 'restore' : 'delete')}
                  disabled={pending}
                >
                  {food.deleted_at ? (
                    <RotateCcw className="h-4 w-4 mr-1" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  {food.deleted_at ? 'Восстановить' : 'Удалить'}
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
          title={confirmKind === 'delete' ? 'Удалить продукт?' : 'Восстановить продукт?'}
          description={food ? `${food.name} (${food.slug})` : undefined}
          confirmLabel={confirmKind === 'delete' ? 'Удалить' : 'Восстановить'}
          variant={confirmKind === 'delete' ? 'destructive' : 'default'}
          onConfirm={async () => {
            if (!food || !confirmKind) return;
            try {
              if (confirmKind === 'delete') {
                await deleteMut.mutateAsync(food.id);
                toast({ title: 'Продукт удалён', variant: 'success' });
              } else {
                await restoreMut.mutateAsync(food.id);
                toast({ title: 'Продукт восстановлен', variant: 'success' });
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
