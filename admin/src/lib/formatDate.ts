import { format } from 'date-fns';

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return '—';
    return format(d, 'dd.MM.yyyy');
  } catch {
    return '—';
  }
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return '—';
    return format(d, 'dd.MM.yyyy HH:mm');
  } catch {
    return '—';
  }
}

export function toIsoDateInput(value: string | Date | null | undefined): string {
  if (!value) return '';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return '';
    return format(d, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

export function toIsoDateTimeInput(value: string | Date | null | undefined): string {
  if (!value) return '';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return '';
    return format(d, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}
