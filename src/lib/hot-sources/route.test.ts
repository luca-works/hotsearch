import assert from 'node:assert/strict';
import test from 'node:test';

import { createHotSourceRoute } from './route.ts';
import type { HotSourceAdapter } from './types.ts';

const item = (title: string): App.HotListItem => ({
  id: title,
  title,
  url: `https://example.com/${title}`,
  mobileUrl: `https://example.com/${title}`,
});

const request = (key: string, refresh = false) => new Request(
  `http://localhost/api/${key}${refresh ? '?refresh=1' : ''}`,
);

test('normal requests share the source cache while manual refresh bypasses it', async () => {
  let calls = 0;
  const adapter: HotSourceAdapter = {
    key: 'route-cache-test',
    label: 'Route cache test',
    cacheTtlMs: 60_000,
    async load() {
      calls += 1;
      return [item(`result-${calls}`)];
    },
  };
  const route = createHotSourceRoute(adapter);

  const fresh = await route(request(adapter.key));
  const hit = await route(request(adapter.key));
  const refreshed = await route(request(adapter.key, true));

  assert.equal(calls, 2);
  assert.equal((await fresh.json()).cacheStatus, 'fresh');
  assert.equal((await hit.json()).cacheStatus, 'hit');
  assert.equal((await refreshed.json()).cacheStatus, 'refreshed');
  assert.equal(fresh.headers.get('Cache-Control'), 'public, max-age=0, s-maxage=60');
  assert.equal(refreshed.headers.get('Cache-Control'), 'no-store');
});

test('empty refresh results keep the last good data and report stale state', async () => {
  let returnEmpty = false;
  const adapter: HotSourceAdapter = {
    key: 'route-stale-test',
    label: 'Route stale test',
    async load() {
      return returnEmpty ? [] : [item('last-good-result')];
    },
  };
  const route = createHotSourceRoute(adapter);

  const initial = await route(request(adapter.key));
  const initialBody = await initial.json() as App.IResponse;
  returnEmpty = true;
  const stale = await route(request(adapter.key, true));
  const staleBody = await stale.json() as App.IResponse;

  assert.equal(stale.status, 200);
  assert.equal(staleBody.cacheStatus, 'stale');
  assert.equal(staleBody.cachedAt, initialBody.cachedAt);
  assert.deepEqual(staleBody.data, initialBody.data);
  assert.equal(stale.headers.get('Cache-Control'), 'no-store');
});

test('uncached empty results fail with a current timestamp and no-store', async () => {
  const adapter: HotSourceAdapter = {
    key: 'route-empty-test',
    label: 'Route empty test',
    staleIfError: false,
    async load() {
      return [];
    },
  };
  const route = createHotSourceRoute(adapter);
  const startedAt = Date.now();
  const response = await route(request(adapter.key));
  const body = await response.json() as App.IResponse;

  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.ok(body.timestamp >= startedAt && body.timestamp <= Date.now());
  assert.equal(body.data, undefined);
});
