import { supabase } from '@/lib/supabase';
import { getPostBySlug } from './getPostBySlug';

const fromMock = supabase.from as jest.Mock;

describe('getPostBySlug', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает пост', async () => {
    const single = jest.fn().mockResolvedValueOnce({
      data: { id: '1', slug: 'p', title: 'P' },
      error: null,
    });
    const eq = jest.fn(() => ({ single }));
    fromMock.mockReturnValueOnce({ select: () => ({ eq }) });

    const res = await getPostBySlug('p');
    expect(fromMock).toHaveBeenCalledWith('blog_posts');
    expect(eq).toHaveBeenCalledWith('slug', 'p');
    expect(res?.title).toBe('P');
  });

  it('бросает error', async () => {
    const single = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'nf' } });
    fromMock.mockReturnValueOnce({ select: () => ({ eq: () => ({ single }) }) });
    await expect(getPostBySlug('x')).rejects.toEqual({ message: 'nf' });
  });
});
