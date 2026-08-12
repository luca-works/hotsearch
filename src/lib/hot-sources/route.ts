import { NextResponse } from 'next/server.js';

import { responseError, responseSuccess } from '../api-response.ts';
import type { HotSourceAdapter } from './types';

type CacheEntry = {
  data: App.HotListItem[];
  expiresAt: number;
  loadedAt: number;
};

type SourceResult = {
  data: App.HotListItem[];
  cached: boolean;
  cachedAt: number;
  cacheStatus: NonNullable<App.IResponse['cacheStatus']>;
};

const DEFAULT_CACHE_TTL_MS = 2 * 60 * 1_000;
const cache = new Map<string, CacheEntry>();
const pendingLoads = new Map<string, Promise<SourceResult>>();

const cacheTtlMs = (adapter: HotSourceAdapter) => adapter.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;

const loadSource = async (adapter: HotSourceAdapter, forceRefresh: boolean) => {
  const existing = cache.get(adapter.key);
  if (!forceRefresh && existing && existing.expiresAt > Date.now()) {
    return {
      data: existing.data,
      cached: true,
      cachedAt: existing.loadedAt,
      cacheStatus: 'hit' as const,
    };
  }

  const pendingKey = `${adapter.key}:${forceRefresh ? 'refresh' : 'normal'}`;
  const pending = pendingLoads.get(pendingKey);
  if (pending) return pending;

  const load = adapter.load({ signal: AbortSignal.timeout(8_000) })
    .then((data) => {
      if (!data.length) {
        throw new Error('Upstream returned an empty list');
      }

      const loadedAt = Date.now();
      cache.set(adapter.key, {
        data,
        expiresAt: loadedAt + cacheTtlMs(adapter),
        loadedAt,
      });
      return {
        data,
        cached: false,
        cachedAt: loadedAt,
        cacheStatus: forceRefresh ? 'refreshed' as const : 'fresh' as const,
      };
    })
    .catch((error) => {
      const stale = cache.get(adapter.key);
      if (adapter.staleIfError !== false && stale) {
        console.warn(`[hot-source:${adapter.key}] ${adapter.label} using stale cache`, error);
        return {
          data: stale.data,
          cached: true,
          cachedAt: stale.loadedAt,
          cacheStatus: 'stale' as const,
        };
      }
      throw error;
    })
    .finally(() => {
      pendingLoads.delete(pendingKey);
    });

  pendingLoads.set(pendingKey, load);
  return load;
};

export const createHotSourceRoute = (adapter: HotSourceAdapter) => async (request?: Request) => {
  const forceRefresh = request
    ? new URL(request.url).searchParams.get('refresh') === '1'
    : false;

  try {
    const result = await loadSource(adapter, forceRefresh);
    const ttlSeconds = Math.max(1, Math.round(cacheTtlMs(adapter) / 1_000));
    return NextResponse.json(
      responseSuccess(result.data, {
        cached: result.cached,
        cachedAt: result.cachedAt,
        cacheStatus: result.cacheStatus,
      }),
      {
        headers: {
          'Cache-Control': forceRefresh
            ? 'no-store'
            : `public, max-age=0, s-maxage=${ttlSeconds}`,
        },
      },
    );
  } catch (error) {
    console.error(`[hot-source:${adapter.key}] ${adapter.label} load failed`, error);
    return NextResponse.json(responseError(), {
      status: 502,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
};
