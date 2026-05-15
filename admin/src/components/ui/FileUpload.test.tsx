import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/lib/storage', () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  getPublicUrl: vi.fn(() => 'https://x/p'),
  getSignedUrl: vi.fn(async () => 'https://x/signed'),
  generateStoragePath: vi.fn((prefix: string, name: string) => `${prefix}/123-${name}`),
  isPublicBucket: vi.fn((b: string) => b !== 'exercise-media'),
}));

import { FileUpload } from './FileUpload';
import * as storage from '@/lib/storage';

beforeEach(() => {
  vi.clearAllMocks();
});

function pickFile(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
}

describe('FileUpload', () => {
  it('upload — happy path: вызывает uploadFile + onChange с новым path', async () => {
    (storage.uploadFile as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ path: 'p/123-a.png' });
    const onChange = vi.fn();
    render(
      <FileUpload
        bucket="blog-media"
        pathPrefix="p"
        value={null}
        onChange={onChange}
        accept="image/png"
        maxSizeMB={5}
        kind="image"
      />,
    );
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    pickFile(file);
    await waitFor(() => expect(storage.uploadFile).toHaveBeenCalled());
    expect(onChange).toHaveBeenCalledWith('p/123-a.png');
  });

  it('валидация типа — onError вызывается, uploadFile нет', async () => {
    const onError = vi.fn();
    const onChange = vi.fn();
    render(
      <FileUpload
        bucket="blog-media"
        pathPrefix="p"
        value={null}
        onChange={onChange}
        accept="image/png"
        maxSizeMB={5}
        kind="image"
        onError={onError}
      />,
    );
    pickFile(new File(['x'], 'a.txt', { type: 'text/plain' }));
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(storage.uploadFile).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('валидация размера', async () => {
    const onError = vi.fn();
    const onChange = vi.fn();
    render(
      <FileUpload
        bucket="blog-media"
        pathPrefix="p"
        value={null}
        onChange={onChange}
        accept="image/png"
        maxSizeMB={1}
        kind="image"
        onError={onError}
      />,
    );
    const bigBlob = new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'image/png' });
    const big = new File([bigBlob], 'big.png', { type: 'image/png' });
    pickFile(big);
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(storage.uploadFile).not.toHaveBeenCalled();
  });

  it('кнопка удаления вызывает deleteFile + onChange(null)', async () => {
    (storage.deleteFile as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
    const onChange = vi.fn();
    render(
      <FileUpload
        bucket="blog-media"
        pathPrefix="p"
        value="p/old.png"
        onChange={onChange}
        accept="image/png"
        maxSizeMB={5}
        kind="image"
      />,
    );
    const btn = await screen.findByText('Удалить');
    fireEvent.click(btn);
    await waitFor(() => expect(storage.deleteFile).toHaveBeenCalledWith('blog-media', 'p/old.png'));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
