import { useEffect, useState } from 'react';

import { mediaCache, type MediaType } from '@/lib/mediaCache';

export function useCachedMediaUri(opts: {
  slug?: string;
  type: MediaType;
  remoteUrl?: string;
  enabled?: boolean;
}): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!opts.enabled || !opts.slug) return;

    const local = mediaCache.has(opts.slug, opts.type)
      ? mediaCache.getLocalUriSync(opts.slug, opts.type)
      : null;

    if (local) {
      setUri(local);
      return;
    }

    if (!opts.remoteUrl) return;

    setUri(opts.remoteUrl);

    let cancelled = false;
    void mediaCache
      .download(opts.slug, opts.type, opts.remoteUrl)
      .then((path) => {
        if (!cancelled) setUri(path);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [opts.slug, opts.type, opts.remoteUrl, opts.enabled]);

  return uri;
}
