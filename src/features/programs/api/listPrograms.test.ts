import { supabase } from '@/lib/supabase';
import { listPrograms } from './listPrograms';

const fromMock = supabase.from as jest.Mock;

describe('listPrograms', () => {
  beforeEach(() => fromMock.mockReset());

  it('возвращает все programs', async () => {
    const order = jest.fn().mockResolvedValueOnce({
      data: [{ id: '1', slug: 'p' }],
      error: null,
    });
    fromMock.mockReturnValueOnce({ select: () => ({ order }) });

    const res = await listPrograms();
    expect(fromMock).toHaveBeenCalledWith('programs');
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(res).toHaveLength(1);
  });

  it('бросает error', async () => {
    const order = jest.fn().mockResolvedValueOnce({ data: null, error: { message: 'e' } });
    fromMock.mockReturnValueOnce({ select: () => ({ order }) });
    await expect(listPrograms()).rejects.toEqual({ message: 'e' });
  });
});
