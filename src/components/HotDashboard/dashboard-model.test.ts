import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAggregateItems,
  buildFocusItems,
  filterBoardItems,
  filterPlatformsByCategory,
  filterPlatformsByLabel,
  findItemRank,
  getWorkoffState,
  groupPlatforms,
  mergePlatformOrder,
  resolveActivePlatformValue,
  resolvePlatformAfterCategoryChange,
} from './dashboard-model.ts';

const platforms = [
  { value: 'weibo', label: '微博', category: 'ent', accentColor: '#ff8200' },
  { value: 'zhihu', label: '知乎', category: 'comm', accentColor: '#0084ff' },
  { value: 'ithome', label: 'IT之家', category: 'tech', accentColor: '#f43f5e' },
];

test('category filtering preserves configured platform order', () => {
  assert.deepEqual(
    filterPlatformsByCategory(platforms, 'tech').map(platform => platform.value),
    ['ithome'],
  );
  assert.deepEqual(
    filterPlatformsByCategory(platforms, 'all').map(platform => platform.value),
    ['weibo', 'zhihu', 'ithome'],
  );
});

test('saved platform order keeps user choices and appends newly added platforms', () => {
  assert.deepEqual(mergePlatformOrder(platforms, ['zhihu', 'weibo']), [
    'zhihu',
    'weibo',
    'ithome',
  ]);
  assert.deepEqual(mergePlatformOrder(platforms, ['removed', 'weibo']), [
    'weibo',
    'zhihu',
    'ithome',
  ]);
});

test('platform directory groups platforms by user intent', () => {
  const groups = groupPlatforms(platforms);

  assert.deepEqual(groups.map(group => group.category), ['community', 'tech']);
  assert.deepEqual(groups.map(group => group.platforms.map(platform => platform.value)), [
    ['weibo', 'zhihu'],
    ['ithome'],
  ]);
});

test('aggregate board interleaves platforms and removes duplicate titles', () => {
  const result = buildAggregateItems(platforms, {
    weibo: { data: [{ id: 1, title: '共同热点' }, { id: 2, title: '微博第二条' }] },
    zhihu: { data: [{ id: 3, title: '共同热点' }, { id: 4, title: '知乎第二条' }] },
    ithome: { data: [{ id: 5, title: '科技新闻' }] },
  });

  assert.deepEqual(result.map(item => [item.title, item.sourcePlatformLabel]), [
    ['共同热点', '微博'],
    ['科技新闻', 'IT之家'],
    ['微博第二条', '微博'],
    ['知乎第二条', '知乎'],
  ]);
  assert.equal(new Set(result.map(item => item.id)).size, result.length);
});

test('platform directory search matches labels case-insensitively', () => {
  assert.deepEqual(filterPlatformsByLabel(platforms, ' IT '), [platforms[2]]);
  assert.deepEqual(filterPlatformsByLabel(platforms, '微博'), [platforms[0]]);
  assert.deepEqual(filterPlatformsByLabel(platforms, '  '), platforms);
});

test('active platform falls back to the first visible platform', () => {
  assert.equal(resolveActivePlatformValue(platforms, 'zhihu'), 'zhihu');
  assert.equal(resolveActivePlatformValue(platforms, 'missing'), 'weibo');
  assert.equal(resolveActivePlatformValue([], 'weibo'), undefined);
});

test('changing category selects the first platform in that category', () => {
  assert.equal(resolvePlatformAfterCategoryChange(platforms, 'tech'), 'ithome');
  assert.equal(resolvePlatformAfterCategoryChange(platforms, 'all'), 'weibo');
  assert.equal(resolvePlatformAfterCategoryChange([], 'all'), undefined);
});

test('board search trims the query and matches titles case-insensitively', () => {
  const items = [
    { id: 1, title: 'DeepSeek 发布新模型' },
    { id: 2, title: '小米 REDMI Note 17 发布' },
  ];

  assert.deepEqual(filterBoardItems(items, '  deepseek  '), [items[0]]);
  assert.deepEqual(filterBoardItems(items, 'redmi'), [items[1]]);
  assert.deepEqual(filterBoardItems(items, '   '), items);
});

test('focus items use the first available story from other live platforms', () => {
  const boards = {
    weibo: { loading: false, data: [{ id: 1, title: '微博第一条', url: 'https://weibo.example' }] },
    zhihu: { loading: false, data: [{ id: 2, title: '知乎第一条', url: 'https://zhihu.example' }] },
    ithome: { loading: true, data: [] },
  };

  const result = buildFocusItems(platforms, boards, 'weibo', 4);

  assert.equal(result.length, 1);
  assert.equal(result[0].platform.value, 'zhihu');
  assert.equal(result[0].item.title, '知乎第一条');
});

test('workoff state formats weekday countdowns and completed workdays', () => {
  assert.deepEqual(getWorkoffState(new Date('2026-07-15T13:15:41')), {
    value: '04:44:19',
    label: '离下班还有一点点',
    detail: '距离周末还有 2 天',
    status: 'counting',
  });

  assert.equal(getWorkoffState(new Date('2026-07-15T18:15:41')).status, 'off-work');
  assert.equal(getWorkoffState(new Date('2026-07-18T13:15:41')).status, 'weekend');
});

test('workoff state respects a custom HH:mm off-work time', () => {
  assert.deepEqual(getWorkoffState(new Date('2026-07-15T17:15:41'), '17:30'), {
    value: '00:14:19',
    label: '离下班还有一点点',
    detail: '距离周末还有 2 天',
    status: 'counting',
  });
  assert.equal(getWorkoffState(new Date('2026-07-15T17:31:00'), '17:30').status, 'off-work');
});

test('workoff state falls back to 18:00 for an invalid custom time', () => {
  assert.equal(getWorkoffState(new Date('2026-07-15T17:31:00'), 'invalid').status, 'counting');
});

test('item rank uses title identity when a source omits item ids', () => {
  const items = [
    { id: undefined, title: '第一条' },
    { id: undefined, title: '第二条' },
    { id: undefined, title: '第三条' },
  ];

  assert.equal(findItemRank(items, items[0]), 1);
  assert.equal(findItemRank(items, items[1]), 2);
  assert.equal(findItemRank(items, items[2]), 3);
});
