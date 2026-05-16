import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Trash2 } from 'lucide-react';
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
import { FileUpload } from '@/components/ui/FileUpload';
import { MarkdownEditor } from '@/components/ui/MarkdownEditor';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { toIsoDateTimeInput } from '@/lib/formatDate';
import {
  useCreateBlogPost,
  useDeleteBlogPost,
  useUpdateBlogPost,
} from '../hooks/useBlogPostMutations';
import type { BlogPost } from '@/types/content';

const schema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Только латиница, цифры, дефис'),
  title: z.string().min(3, 'Минимум 3 символа'),
  excerpt: z.string().optional(),
  body: z.string().min(1, 'Тело поста не может быть пустым'),
  cover_path: z.string().nullable().optional(),
  published_at: z.string().optional(),
});

export type BlogPostFormValues = z.infer<typeof schema>;

export interface BlogPostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: BlogPost | null;
}

export function BlogPostFormDialog({ open, onOpenChange, post }: BlogPostFormDialogProps) {
  const isEdit = !!post;
  const createMut = useCreateBlogPost();
  const updateMut = useUpdateBlogPost();
  const deleteMut = useDeleteBlogPost();
  const pending = createMut.isPending || updateMut.isPending || deleteMut.isPending;
  const [serverError, setServerError] = useState<string | null>(null);
  const [bodyTab, setBodyTab] = useState<'edit' | 'preview'>('edit');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: '',
      title: '',
      excerpt: '',
      body: '',
      cover_path: null,
      published_at: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        post
          ? {
              slug: post.slug,
              title: post.title,
              excerpt: post.excerpt ?? '',
              body: post.body,
              cover_path: post.cover_path,
              published_at: toIsoDateTimeInput(post.published_at),
            }
          : {
              slug: '',
              title: '',
              excerpt: '',
              body: '',
              cover_path: null,
              published_at: '',
            },
      );
      setBodyTab('edit');
      setServerError(null);
    }
  }, [open, post, form]);

  async function onSubmit(values: BlogPostFormValues) {
    setServerError(null);
    const payload = {
      slug: values.slug,
      title: values.title,
      excerpt: values.excerpt?.trim() ? values.excerpt.trim() : null,
      body: values.body,
      cover_path: values.cover_path ?? null,
      published_at: values.published_at ? new Date(values.published_at).toISOString() : null,
    };
    try {
      if (isEdit && post) {
        await updateMut.mutateAsync({ id: post.id, patch: payload });
        toast({ title: 'Пост обновлён', variant: 'success' });
      } else {
        await createMut.mutateAsync(payload);
        toast({ title: 'Пост создан', variant: 'success' });
      }
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось сохранить';
      setServerError(msg);
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    }
  }

  const bodyValue = form.watch('body');
  const coverPath = form.watch('cover_path');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать пост' : 'Новый пост'}</DialogTitle>
          <DialogDescription>
            Тело поста — Markdown с GFM (таблицы, чек-листы, fenced code)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" placeholder="my-first-post" {...form.register('slug')} />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Заголовок</Label>
              <Input id="title" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Краткое описание (excerpt)</Label>
            <Textarea id="excerpt" rows={2} {...form.register('excerpt')} />
          </div>

          <FileUpload
            label="Обложка"
            bucket="blog-media"
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Тело поста (Markdown)</Label>
              <div className="inline-flex rounded-md border bg-muted p-0.5 text-xs">
                {(['edit', 'preview'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setBodyTab(tab)}
                    className={cn(
                      'px-3 py-1 rounded',
                      bodyTab === tab ? 'bg-white shadow-sm' : 'text-muted-foreground',
                    )}
                  >
                    {tab === 'edit' ? 'Редактор' : 'Превью'}
                  </button>
                ))}
              </div>
            </div>
            {bodyTab === 'edit' ? (
              <MarkdownEditor
                value={bodyValue}
                onChange={(v) => form.setValue('body', v, { shouldValidate: true })}
                height={400}
              />
            ) : (
              <div className="prose prose-slate max-w-none border rounded-md p-4 min-h-[400px] bg-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyValue || '_Пусто_'}</ReactMarkdown>
              </div>
            )}
            {form.formState.errors.body && (
              <p className="text-xs text-destructive">{form.formState.errors.body.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="published_at">Дата публикации</Label>
            <Input
              id="published_at"
              type="datetime-local"
              {...form.register('published_at')}
              className="w-64"
            />
            <p className="text-xs text-muted-foreground">
              Пусто — пост сохраняется как draft и не виден в мобилке
            </p>
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <DialogFooter className="sm:justify-between">
            <div>
              {isEdit && post ? (
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

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Удалить пост?"
          description={post ? `${post.title} (${post.slug}). Это действие необратимо.` : undefined}
          confirmLabel="Удалить"
          variant="destructive"
          onConfirm={async () => {
            if (!post) return;
            try {
              await deleteMut.mutateAsync(post.id);
              toast({ title: 'Пост удалён', variant: 'success' });
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
