import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, toIsoDateInput } from './formatDate';

describe('formatDate', () => {
  it('null → —', () => {
    expect(formatDate(null)).toBe('—');
  });
  it('invalid date → —', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
  it('ISO → dd.MM.yyyy', () => {
    expect(formatDate('2026-05-15T12:00:00Z')).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });
});

describe('formatDateTime', () => {
  it('ISO → dd.MM.yyyy HH:mm', () => {
    expect(formatDateTime('2026-05-15T12:00:00Z')).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
  });
});

describe('toIsoDateInput', () => {
  it('null → ""', () => {
    expect(toIsoDateInput(null)).toBe('');
  });
  it('ISO → yyyy-MM-dd', () => {
    expect(toIsoDateInput('2026-05-15T12:00:00Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
