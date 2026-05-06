import { supabase } from '@/lib/supabase';
import { getPublicUrl } from './storage';

const storageFromMock = supabase.storage.from as jest.Mock;

describe('getPublicUrl', () => {
  beforeEach(() => storageFromMock.mockReset());

  it('возвращает publicUrl для bucket+path', () => {
    const getPublicUrlMock = jest.fn(() => ({
      data: { publicUrl: 'https://x.supabase.co/object/public/workout-covers/foo.jpg' },
    }));
    storageFromMock.mockReturnValueOnce({ getPublicUrl: getPublicUrlMock });

    const url = getPublicUrl('workout-covers', 'foo.jpg');
    expect(storageFromMock).toHaveBeenCalledWith('workout-covers');
    expect(getPublicUrlMock).toHaveBeenCalledWith('foo.jpg');
    expect(url).toBe('https://x.supabase.co/object/public/workout-covers/foo.jpg');
  });

  it('возвращает null если path пустой', () => {
    expect(getPublicUrl('workout-covers', null)).toBeNull();
    expect(getPublicUrl('workout-covers', '')).toBeNull();
    expect(storageFromMock).not.toHaveBeenCalled();
  });
});
