import type { Query } from '@tanstack/react-query';

import { persistOptions } from '../queryClient';

const shouldDehydrate = persistOptions.dehydrateOptions.shouldDehydrateQuery;

function makeQuery(queryKey: unknown[], status: string = 'success'): Query {
  return { queryKey, state: { status } } as unknown as Query;
}

describe('shouldDehydrateQuery', () => {
  it('persists exercises.detail', () => {
    expect(shouldDehydrate(makeQuery(['exercises', 'detail', 'squat']))).toBe(true);
  });

  it('persists workouts.list', () => {
    expect(shouldDehydrate(makeQuery(['workouts', 'list', 'all']))).toBe(true);
  });

  it('persists programs.detail', () => {
    expect(shouldDehydrate(makeQuery(['programs', 'detail', 'beginner']))).toBe(true);
  });

  it('persists blog.list', () => {
    expect(shouldDehydrate(makeQuery(['blog', 'list']))).toBe(true);
  });

  it('skips exercises video-url (signed URL with TTL)', () => {
    expect(shouldDehydrate(makeQuery(['exercises', 'video-url', 'squat']))).toBe(false);
  });

  it('skips exercises gif-url (signed URL with TTL)', () => {
    expect(shouldDehydrate(makeQuery(['exercises', 'gif-url', 'squat']))).toBe(false);
  });

  it('skips search queries', () => {
    expect(shouldDehydrate(makeQuery(['search', 'query', 'push']))).toBe(false);
  });

  it('skips rc.offerings', () => {
    expect(shouldDehydrate(makeQuery(['rc', 'offerings']))).toBe(false);
  });

  it('skips non-success status', () => {
    expect(shouldDehydrate(makeQuery(['exercises', 'detail', 'squat'], 'loading'))).toBe(false);
    expect(shouldDehydrate(makeQuery(['exercises', 'detail', 'squat'], 'error'))).toBe(false);
  });
});
