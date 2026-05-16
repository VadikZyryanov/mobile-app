import { describe, expect, it, vi, beforeEach } from 'vitest';

const orderMock = vi.fn();
const rangeMock = vi.fn();
const isMock = vi.fn();
const notMock = vi.fn();
const orMock = vi.fn();
const selectMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a) },
}));

import { listBlogPosts } from './listBlogPosts';

function makeBuilder(result: { data: unknown; error: unknown; count: number | null }) {
  const builder: Record<string, unknown> = {
    select: (...a: unknown[]) => {
      selectMock(...a);
      return builder;
    },
    order: (...a: unknown[]) => {
      orderMock(...a);
      return builder;
    },
    range: (...a: unknown[]) => {
      rangeMock(...a);
      return builder;
    },
    is: (...a: unknown[]) => {
      isMock(...a);
      return builder;
    },
    not: (...a: unknown[]) => {
      notMock(...a);
      return builder;
    },
    or: (...a: unknown[]) => {
      orMock(...a);
      return builder;
    },
    then: (resolve: (v: typeof result) => unknown) => Promise.resolve(resolve(result)),
  };
  return builder;
}

beforeEach(() => {
  fromMock.mockReset();
  orderMock.mockReset();
  rangeMock.mockReset();
  isMock.mockReset();
  notMock.mockReset();
  orMock.mockReset();
  selectMock.mockReset();
});

describe('listBlogPosts', () => {
  it('status=published — .not("published_at", "is", null)', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listBlogPosts({ offset: 0, limit: 50, status: 'published' });
    expect(notMock).toHaveBeenCalledWith('published_at', 'is', null);
  });

  it('status=draft — .is("published_at", null)', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listBlogPosts({ offset: 0, limit: 50, status: 'draft' });
    expect(isMock).toHaveBeenCalledWith('published_at', null);
  });

  it('status=all — без фильтра', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listBlogPosts({ offset: 0, limit: 50, status: 'all' });
    expect(notMock).not.toHaveBeenCalled();
    expect(isMock).not.toHaveBeenCalled();
  });

  it('search — or ilike title/slug', async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [], error: null, count: 0 }));
    await listBlogPosts({ offset: 0, limit: 50, search: 'foo' });
    expect(orMock).toHaveBeenCalled();
    expect(orMock.mock.calls[0]![0]).toMatch(/title\.ilike\.%foo%/);
    expect(orMock.mock.calls[0]![0]).toMatch(/slug\.ilike\.%foo%/);
  });
});
