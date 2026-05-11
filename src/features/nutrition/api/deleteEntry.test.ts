import { supabase } from '@/lib/supabase';
import { deleteEntry } from './deleteEntry';

const fromMock = supabase.from as jest.Mock;

describe('deleteEntry', () => {
  beforeEach(() => fromMock.mockReset());

  it('удаляет запись по id', async () => {
    const eq = jest.fn().mockResolvedValueOnce({ error: null });
    const del = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ delete: del });

    await expect(deleteEntry('e1')).resolves.toBeUndefined();
    expect(eq).toHaveBeenCalledWith('id', 'e1');
  });

  it('бросает ошибку при error', async () => {
    const eq = jest.fn().mockResolvedValueOnce({ error: { message: 'not found' } });
    const del = jest.fn(() => ({ eq }));
    fromMock.mockReturnValueOnce({ delete: del });

    await expect(deleteEntry('e1')).rejects.toEqual({ message: 'not found' });
  });
});
