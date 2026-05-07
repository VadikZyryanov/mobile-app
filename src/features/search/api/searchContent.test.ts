import { supabase } from '@/lib/supabase';

import { searchContent } from './searchContent';

const rpcMock = supabase.rpc as jest.Mock;

describe('searchContent', () => {
  beforeEach(() => rpcMock.mockReset());

  it('вызывает RPC search_content', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          kind: 'exercise',
          id: '1',
          slug: 'squat',
          title: 'Squat',
          subtitle: 'quads',
          cover_path: null,
          min_tier: 'pro',
          rank: 0.5,
        },
      ],
      error: null,
    });
    const res = await searchContent('squat');
    expect(rpcMock).toHaveBeenCalledWith('search_content', { q: 'squat' });
    expect(res).toHaveLength(1);
    expect(res[0]?.kind).toBe('exercise');
  });

  it('возвращает [] если query короче 2 символов', async () => {
    expect(await searchContent('a')).toEqual([]);
    expect(await searchContent('')).toEqual([]);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('бросает error', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'e' } });
    await expect(searchContent('squat')).rejects.toEqual({ message: 'e' });
  });
});
