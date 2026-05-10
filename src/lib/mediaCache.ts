import * as FileSystem from 'expo-file-system/legacy';
import { storage, StorageKeys } from '@/lib/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MediaType = 'video' | 'gif';

export type MediaEntry = {
  slug: string;
  type: MediaType;
  localPath: string;
  size: number;
  lastAccessedAt: number;
  createdAt: number;
  ext: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MEDIA_CACHE_DIR = `${FileSystem.cacheDirectory}exercise-media/`;
const LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB

// ─── Internal state ───────────────────────────────────────────────────────────

const index: Record<string, MediaEntry> = {};
const inFlight = new Map<string, Promise<string>>();
const listeners = new Set<() => void>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function entryKey(slug: string, type: MediaType): string {
  return `${type}:${slug}`;
}

function extractExt(url: string, type: MediaType): string {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split('/').pop() ?? '';
    const dotIndex = lastSegment.lastIndexOf('.');
    if (dotIndex !== -1 && dotIndex < lastSegment.length - 1) {
      return lastSegment.slice(dotIndex + 1);
    }
  } catch {
    // fallthrough
  }
  return type === 'video' ? 'mp4' : 'gif';
}

function notify(): void {
  listeners.forEach((l) => l());
}

async function persistIndex(): Promise<void> {
  await storage.setJSON<Record<string, MediaEntry>>(StorageKeys.mediaCacheIndex, index);
}

function totalSizeInternal(): number {
  return Object.values(index).reduce((sum, e) => sum + e.size, 0);
}

async function enforceLimit(): Promise<void> {
  let total = totalSizeInternal();
  if (total <= LIMIT_BYTES) return;

  const sorted = Object.values(index).sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

  for (const e of sorted) {
    if (total <= LIMIT_BYTES * 0.9) break;
    await FileSystem.deleteAsync(e.localPath, { idempotent: true });
    delete index[entryKey(e.slug, e.type)];
    total -= e.size;
  }

  await persistIndex();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const mediaCache = {
  async init(): Promise<void> {
    for (const key of Object.keys(index)) {
      delete index[key];
    }
    const saved = await storage.getJSON<Record<string, MediaEntry>>(StorageKeys.mediaCacheIndex);
    if (!saved) return;

    // Verify each entry's file actually exists on disk
    await Promise.all(
      Object.entries(saved).map(async ([key, entry]) => {
        const info = await FileSystem.getInfoAsync(entry.localPath);
        if (info.exists) {
          index[key] = entry;
        }
      }),
    );
  },

  has(slug: string, type: MediaType): boolean {
    return entryKey(slug, type) in index;
  },

  getLocalUriSync(slug: string, type: MediaType): string | null {
    const key = entryKey(slug, type);
    const entry = index[key];
    if (!entry) return null;

    // Bump lastAccessedAt in-memory only — no persist needed here
    index[key] = { ...entry, lastAccessedAt: Date.now() };
    return entry.localPath;
  },

  async download(slug: string, type: MediaType, remoteUrl: string): Promise<string> {
    // 1. Already cached
    if (mediaCache.has(slug, type)) {
      return mediaCache.getLocalUriSync(slug, type)!;
    }

    const key = entryKey(slug, type);

    // 2. Already in-flight
    const existing = inFlight.get(key);
    if (existing) return existing;

    // 3. Start new download
    const promise = (async (): Promise<string> => {
      const ext = extractExt(remoteUrl, type);
      const dir = `${MEDIA_CACHE_DIR}${type}/`;
      const localPath = `${dir}${slug}.${ext}`;

      // Ensure directory exists
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      // Download the file
      await FileSystem.downloadAsync(remoteUrl, localPath);

      // Get real file size
      const info = await FileSystem.getInfoAsync(localPath);
      const size = info.exists ? info.size : 0;

      const now = Date.now();
      const entry: MediaEntry = {
        slug,
        type,
        localPath,
        size,
        lastAccessedAt: now,
        createdAt: now,
        ext,
      };

      index[key] = entry;
      await persistIndex();
      await enforceLimit();
      notify();

      return localPath;
    })();

    inFlight.set(key, promise);
    promise.finally(() => inFlight.delete(key));

    return promise;
  },

  async remove(slug: string, type: MediaType): Promise<void> {
    const key = entryKey(slug, type);
    const entry = index[key];
    if (!entry) return;

    await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
    delete index[key];
    await persistIndex();
    notify();
  },

  async clearAll(): Promise<void> {
    await FileSystem.deleteAsync(MEDIA_CACHE_DIR, { idempotent: true });

    // Clear all keys from the index object
    for (const key of Object.keys(index)) {
      delete index[key];
    }

    await storage.remove(StorageKeys.mediaCacheIndex);
    notify();
  },

  totalSize(): number {
    return totalSizeInternal();
  },

  list(): readonly MediaEntry[] {
    return Object.values(index);
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
