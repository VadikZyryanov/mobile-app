import { act, renderHook, waitFor } from '@testing-library/react-native';

import { mediaCache } from '@/lib/mediaCache';
import { useCachedMediaUri } from '../useCachedMediaUri';

beforeEach(async () => {
  jest.clearAllMocks();
  await mediaCache.clearAll();
  await mediaCache.init();
});

describe('useCachedMediaUri', () => {
  it('returns null when disabled', () => {
    const { result } = renderHook(() =>
      useCachedMediaUri({
        slug: 'squat',
        type: 'video',
        remoteUrl: 'https://x.com/v.mp4',
        enabled: false,
      }),
    );
    expect(result.current).toBeNull();
  });

  it('returns null when no slug', () => {
    const { result } = renderHook(() =>
      useCachedMediaUri({ type: 'video', remoteUrl: 'https://x.com/v.mp4', enabled: true }),
    );
    expect(result.current).toBeNull();
  });

  it('returns remoteUrl immediately then swaps to local path', async () => {
    const remoteUrl = 'https://example.com/squat.mp4';
    const { result } = renderHook(() =>
      useCachedMediaUri({ slug: 'squat', type: 'video', remoteUrl, enabled: true }),
    );

    expect(result.current).toBe(remoteUrl);

    await waitFor(() => {
      expect(result.current).not.toBe(remoteUrl);
      expect(result.current).toContain('squat');
    });
  });

  it('returns local file:// path immediately when already cached', async () => {
    await act(async () => {
      await mediaCache.download('squat', 'video', 'https://example.com/squat.mp4');
    });

    const { result } = renderHook(() =>
      useCachedMediaUri({
        slug: 'squat',
        type: 'video',
        remoteUrl: 'https://example.com/squat.mp4',
        enabled: true,
      }),
    );

    expect(result.current).toContain('squat');
    expect(result.current).not.toBe('https://example.com/squat.mp4');
  });
});
