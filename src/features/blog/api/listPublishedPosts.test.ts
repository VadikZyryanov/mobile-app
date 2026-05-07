import { supabase } from '@/lib/supabase';
import { listPublishedPosts } from './listPublishedPosts';

const fromMock = supabase.from as jest.Mock;

describe('listPublishedPosts', () => {
  beforeEach(() => fromMock.mockReset());

  it('фильтрует по published_at not null и сортирует desc', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: [{ id: '1', slug: 'p' }], error: null });
    const not = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ not }));
    fromMock.mockReturnValueOnce({ select });

    const res = await listPublishedPosts();
    expect(fromMock).toHaveBeenCalledWith('blog_posts');
    expect(not).toHaveBeenCalledWith('published_at', 'is', null);
    expect(order).toHaveBeenCalledWith('published_at', { ascending: false });
    expect(res).toHaveLength(1);
  });

  it('бросает error', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'e' } });
    const not = jest.fn(() => ({ order }));
    fromMock.mockReturnValueOnce({ select: () => ({ not }) });
    await expect(listPublishedPosts()).rejects.toEqual({ message: 'e' });
  });
});
