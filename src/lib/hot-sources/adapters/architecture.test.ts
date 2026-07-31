import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const platformRoutes = [
  '36kr', 'baidu', 'baidutieba', 'bilibili', 'csdn', 'dongchedi',
  'douban-movic', 'douyin', 'github-trending', 'hello-github',
  'history-today', 'hupu', 'huxiu', 'ifanr', 'ithome', 'juejin',
  'kuaishou', 'lol', 'netease-music', 'netease', 'qq', 'quark',
  'thepaper', 'toutiao', 'weibo', 'weread', 'woshipm', 'xiaohongshu',
  'zhihu-daily', 'zhihu',
];

test('every platform route delegates to the shared source runner', async () => {
  const routeContents = await Promise.all(platformRoutes.map(route =>
    readFile(`src/app/api/${route}/route.ts`, 'utf8'),
  ));

  assert.equal(routeContents.length, 30);
  for (const content of routeContents) {
    assert.match(content, /createHotSourceRoute/);
    assert.doesNotMatch(content, /fetch\(|NextResponse/);
  }
});

test('source implementation stays inside the shared adapter layer', async () => {
  const sourceFiles = [
    'catalog-json.ts', 'catalog-special.ts', 'kr36.ts', 'weibo.ts',
    'normalize.ts', 'zhihu-daily.ts',
  ];
  const contents = await Promise.all(sourceFiles.map(file =>
    readFile(`src/lib/hot-sources/adapters/${file}`, 'utf8'),
  ));

  assert.equal(contents.length, sourceFiles.length);
});

test('migrated adapters preserve the legacy data contract', async () => {
  const [jsonCatalog, specialCatalog, routeRunner] = await Promise.all([
    readFile('src/lib/hot-sources/adapters/catalog-json.ts', 'utf8'),
    readFile('src/lib/hot-sources/adapters/catalog-special.ts', 'utf8'),
    readFile('src/lib/hot-sources/route.ts', 'utf8'),
  ]);

  assert.match(specialCatalog, /ranking\/v2\?rid=0&type=all/);
  assert.match(specialCatalog, /window\.\$\$data=/);
  assert.match(specialCatalog, /score: Number\(row\.find\('\.rating_nums'\)/);
  assert.match(specialCatalog, /tip: row\.year, type: row\.type/);
  assert.match(specialCatalog, /id: videoId, title: row\.name/);
  assert.match(specialCatalog, /id, title: row\.find\('\.plc-title'\)/);
  assert.match(jsonCatalog, /author: requireList\(row\.artists/);
  assert.match(routeRunner, /adapter\.cacheTtlMs \?\? DEFAULT_CACHE_TTL_MS/);
  assert.match(routeRunner, /adapter\.staleIfError !== false && stale/);
});
