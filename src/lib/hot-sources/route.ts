import { NextResponse } from 'next/server';

import type { HotSourceAdapter } from './types';

import { responseError, responseSuccess } from '@/lib/utils';

type CacheEntry = {
  data: App.HotListItem[];
  expiresAt: number;
  loadedAt: number;
};

type SourceResult = {
  data: App.HotListItem[];
  cached: boolean;
  cachedAt: number;
};

const DEFAULT_CACHE_TTL_MS = 2 * 60 * 1_000;
const cache = new Map<string, CacheEntry>();
const pendingLoads = new Map<string, Promise<SourceResult>>();

const loadSource = async (adapter: HotSourceAdapter) => {
  const cached = cache.get(adapter.key);
  if (cached && cached.expiresAt > Date.now()) {
    return { data: cached.data, cached: true, cachedAt: cached.loadedAt };
  }

  const pending = pendingLoads.get(adapter.key);
  if (pending) return pending;

  const load = adapter.load({ signal: AbortSignal.timeout(8_000) })
    .then((data) => {
      const loadedAt = Date.now();
      cache.set(adapter.key, {
        data,
        expiresAt: loadedAt + (adapter.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS),
        loadedAt,
      });
      return { data, cached: false, cachedAt: loadedAt };
    })
    .catch((error) => {
      const stale = cache.get(adapter.key);
      if (adapter.staleIfError !== false && stale) {
        return { data: stale.data, cached: true, cachedAt: stale.loadedAt };
      }
      throw error;
    })
    .finally(() => {
      pendingLoads.delete(adapter.key);
    });

  pendingLoads.set(adapter.key, load);
  return load;
};

export const createHotSourceRoute = (adapter: HotSourceAdapter) => async () => {
  try {
    const result = await loadSource(adapter);
    return NextResponse.json(
      responseSuccess(result.data, {
        cached: result.cached,
        cachedAt: result.cachedAt,
      }),
      {
        headers: {
          'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (error) {
    console.error(`[hot-source:${adapter.key}] ${adapter.label} load failed`, error);
    return NextResponse.json(responseError, { status: 502 });
  }
};
