import { useEffect, useRef, useState } from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  type AdminBucket,
  deleteFile,
  generateStoragePath,
  getPublicUrl,
  getSignedUrl,
  isPublicBucket,
  uploadFile,
} from '@/lib/storage';

export type FileUploadKind = 'image' | 'video' | 'gif';

export interface FileUploadProps {
  bucket: AdminBucket;
  pathPrefix: string;
  value: string | null | undefined;
  onChange: (path: string | null) => void;
  accept: string;
  maxSizeMB: number;
  kind: FileUploadKind;
  label?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export function FileUpload({
  bucket,
  pathPrefix,
  value,
  onChange,
  accept,
  maxSizeMB,
  kind,
  label,
  disabled,
  onError,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    if (isPublicBucket(bucket)) {
      setPreviewUrl(getPublicUrl(bucket, value));
      return;
    }
    setPreviewUrl(null);
    getSignedUrl(bucket, value)
      .then((url) => {
        if (!cancelled) setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket, value]);

  function reportError(msg: string) {
    if (onError) onError(msg);
    else console.error(msg);
  }

  function validate(file: File): string | null {
    const types = accept
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (types.length && !types.includes(file.type) && !types.includes('*/*')) {
      return `Недопустимый тип файла: ${file.type || 'unknown'}. Разрешены: ${types.join(', ')}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Размер файла превышает ${maxSizeMB}MB`;
    }
    return null;
  }

  async function handleFile(file: File) {
    const err = validate(file);
    if (err) {
      reportError(err);
      return;
    }
    setUploading(true);
    try {
      const path = generateStoragePath(pathPrefix, file.name);
      await uploadFile(bucket, file, path);
      onChange(path);
    } catch (e) {
      reportError(e instanceof Error ? e.message : 'Не удалось загрузить файл');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    if (!value) return;
    try {
      await deleteFile(bucket, value);
    } catch {
      // если удаление не удалось — всё равно сбрасываем ссылку в форме
    }
    onChange(null);
  }

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm font-medium">{label}</p> : null}

      {value ? (
        <div className="rounded-md border bg-muted/30 p-2 flex items-start gap-3">
          <div className="w-32 h-32 rounded overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
            {previewUrl ? (
              kind === 'video' ? (
                <video src={previewUrl} className="w-full h-full object-cover" muted />
              ) : (
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
              )
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground break-all">{value}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-7 text-destructive"
              onClick={handleRemove}
              disabled={disabled || uploading}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Удалить
            </Button>
          </div>
        </div>
      ) : (
        <label
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 cursor-pointer transition-colors',
            uploading ? 'opacity-60 cursor-wait' : 'hover:bg-muted/40',
            disabled && 'opacity-50 pointer-events-none',
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploading ? 'Загрузка…' : 'Кликни, чтобы выбрать файл'}
          </span>
          <span className="text-xs text-muted-foreground">до {maxSizeMB}MB</span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </label>
      )}
    </div>
  );
}
