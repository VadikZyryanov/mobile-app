import * as FileSystem from 'expo-file-system/legacy';

import { mediaCache } from '../mediaCache';

beforeEach(async () => {
  jest.clearAllMocks();
  await mediaCache.clearAll();
  await mediaCache.init();
});

describe('mediaCache.download', () => {
  it('downloads file and adds index entry', async () => {
    const path = await mediaCache.download('squat', 'video', 'https://example.com/squat.mp4');
    expect(path).toContain('squat');
    expect(mediaCache.has('squat', 'video')).toBe(true);
    expect(mediaCache.list()).toHaveLength(1);
  });

  it('returns cached path on second call without re-downloading', async () => {
    await mediaCache.download('squat', 'video', 'https://example.com/squat.mp4');
    const callsBefore = (FileSystem.downloadAsync as jest.Mock).mock.calls.length;
    await mediaCache.download('squat', 'video', 'https://example.com/squat.mp4');
    expect((FileSystem.downloadAsync as jest.Mock).mock.calls.length).toBe(callsBefore);
  });

  it('deduplicates concurrent downloads for same slug+type', async () => {
    const [p1, p2] = await Promise.all([
      mediaCache.download('squat', 'gif', 'https://example.com/squat.gif'),
      mediaCache.download('squat', 'gif', 'https://example.com/squat.gif'),
    ]);
    expect(p1).toBe(p2);
    expect((FileSystem.downloadAsync as jest.Mock).mock.calls.length).toBe(1);
  });
});

describe('mediaCache.getLocalUriSync', () => {
  it('returns null when not cached', () => {
    expect(mediaCache.getLocalUriSync('unknown', 'video')).toBeNull();
  });

  it('bumps lastAccessedAt on access', async () => {
    await mediaCache.download('squat', 'video', 'https://example.com/squat.mp4');
    const before = mediaCache.list().find((e) => e.slug === 'squat')!.lastAccessedAt;
    await new Promise((r) => setTimeout(r, 5));
    mediaCache.getLocalUriSync('squat', 'video');
    const after = mediaCache.list().find((e) => e.slug === 'squat')!.lastAccessedAt;
    expect(after).toBeGreaterThanOrEqual(before);
  });
});

describe('mediaCache.clearAll', () => {
  it('removes all entries and notifies listeners', async () => {
    await mediaCache.download('squat', 'video', 'https://example.com/squat.mp4');
    const listener = jest.fn();
    const unsub = mediaCache.subscribe(listener);
    await mediaCache.clearAll();
    expect(mediaCache.list()).toHaveLength(0);
    expect(listener).toHaveBeenCalled();
    unsub();
  });
});

describe('mediaCache.init', () => {
  it('drops entries whose file no longer exists on disk', async () => {
    await mediaCache.download('squat', 'video', 'https://example.com/squat.mp4');
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
      exists: false,
      uri: '',
      isDirectory: false,
    });
    await mediaCache.init();
    expect(mediaCache.has('squat', 'video')).toBe(false);
  });
});

describe('mediaCache.subscribe', () => {
  it('returns unsubscribe function', async () => {
    const listener = jest.fn();
    const unsub = mediaCache.subscribe(listener);
    unsub();
    await mediaCache.download('squat', 'video', 'https://example.com/squat.mp4');
    expect(listener).not.toHaveBeenCalled();
  });
});
