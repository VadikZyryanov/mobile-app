import { describe, expect, it, vi, beforeEach } from 'vitest';

const uploadMock = vi.fn();
const removeMock = vi.fn();
const getPublicUrlMock = vi.fn();
const createSignedUrlMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: (...args: unknown[]) => fromMock(...args),
    },
  },
}));

import {
  uploadFile,
  deleteFile,
  getPublicUrl,
  getSignedUrl,
  generateStoragePath,
  isPublicBucket,
} from './storage';

beforeEach(() => {
  uploadMock.mockReset();
  removeMock.mockReset();
  getPublicUrlMock.mockReset();
  createSignedUrlMock.mockReset();
  fromMock.mockReset().mockReturnValue({
    upload: uploadMock,
    remove: removeMock,
    getPublicUrl: getPublicUrlMock,
    createSignedUrl: createSignedUrlMock,
  });
});

describe('uploadFile', () => {
  it('загружает файл и возвращает path', async () => {
    uploadMock.mockResolvedValueOnce({ data: { path: 'prefix/file.png' }, error: null });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const r = await uploadFile('workout-covers', file, 'prefix/file.png');
    expect(fromMock).toHaveBeenCalledWith('workout-covers');
    expect(uploadMock).toHaveBeenCalledWith(
      'prefix/file.png',
      file,
      expect.objectContaining({ contentType: 'image/png', upsert: false }),
    );
    expect(r).toEqual({ path: 'prefix/file.png' });
  });

  it('throw при ошибке', async () => {
    uploadMock.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    await expect(uploadFile('blog-media', new File(['x'], 'a.png'), 'p/a.png')).rejects.toThrow(
      'boom',
    );
  });
});

describe('deleteFile', () => {
  it('удаляет файл', async () => {
    removeMock.mockResolvedValueOnce({ error: null });
    await deleteFile('blog-media', 'p/a.png');
    expect(removeMock).toHaveBeenCalledWith(['p/a.png']);
  });

  it('throw при ошибке', async () => {
    removeMock.mockResolvedValueOnce({ error: new Error('nope') });
    await expect(deleteFile('blog-media', 'p/a.png')).rejects.toThrow('nope');
  });
});

describe('getPublicUrl', () => {
  it('возвращает publicUrl', () => {
    getPublicUrlMock.mockReturnValueOnce({ data: { publicUrl: 'https://x/a.png' } });
    expect(getPublicUrl('blog-media', 'a.png')).toBe('https://x/a.png');
  });
});

describe('getSignedUrl', () => {
  it('возвращает signedUrl', async () => {
    createSignedUrlMock.mockResolvedValueOnce({
      data: { signedUrl: 'https://x/signed' },
      error: null,
    });
    const r = await getSignedUrl('exercise-media', 'a.mp4', 1800);
    expect(createSignedUrlMock).toHaveBeenCalledWith('a.mp4', 1800);
    expect(r).toBe('https://x/signed');
  });

  it('default expiresIn = 3600', async () => {
    createSignedUrlMock.mockResolvedValueOnce({ data: { signedUrl: 'u' }, error: null });
    await getSignedUrl('exercise-media', 'a.mp4');
    expect(createSignedUrlMock).toHaveBeenCalledWith('a.mp4', 3600);
  });

  it('throw при ошибке', async () => {
    createSignedUrlMock.mockResolvedValueOnce({ data: null, error: new Error('nope') });
    await expect(getSignedUrl('exercise-media', 'a.mp4')).rejects.toThrow('nope');
  });
});

describe('generateStoragePath', () => {
  it('генерирует path с timestamp + slug', () => {
    const path = generateStoragePath('covers', 'My Cool File!.PNG');
    expect(path).toMatch(/^covers\/\d+-my-cool-file-.png$/);
  });

  it('fallback на "file" если имя пустое после санитарии', () => {
    const path = generateStoragePath('covers', '!!!');
    expect(path).toMatch(/^covers\/\d+-file$/);
  });
});

describe('isPublicBucket', () => {
  it('exercise-media — private', () => {
    expect(isPublicBucket('exercise-media')).toBe(false);
  });

  it('blog-media — public', () => {
    expect(isPublicBucket('blog-media')).toBe(true);
  });
});
