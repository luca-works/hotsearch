import assert from 'node:assert/strict';
import test from 'node:test';

import { xiaohongshuAdapter } from './catalog-special.ts';
import { mapKr36Ranking } from './kr36.ts';
import {
  decodeHtmlText,
  sanitizeHupuDescription,
  uniqueBy,
  woshipmArticleUrl,
} from './normalize.ts';
import { mapWeiboTrends } from './weibo.ts';
import { mapZhihuDailyStories } from './zhihu-daily.ts';

test('maps valid Weibo trends and skips incomplete records', () => {
  const result = mapWeiboTrends({
    ok: 1,
    data: {
      realtime: [
        {
          mid: '100',
          word: '测试热点',
          word_scheme: '#测试热点#',
          num: 12345,
          label_name: '新',
        },
        { mid: '101' },
      ],
    },
  });

  assert.equal(result.length, 1);
  assert.deepEqual(result[0], {
    id: '100',
    title: '测试热点',
    desc: '#测试热点#',
    hot: 12345,
    label: '新',
    url: 'https://s.weibo.com/weibo?q=%23%E6%B5%8B%E8%AF%95%E7%83%AD%E7%82%B9%23&t=31&band_rank=1&Refer=top',
    mobileUrl: 'https://s.weibo.com/weibo?q=%23%E6%B5%8B%E8%AF%95%E7%83%AD%E7%82%B9%23&t=31&band_rank=1&Refer=top',
  });
});

test('maps a 36Kr ranking response into the application contract', () => {
  const result = mapKr36Ranking({
    code: 0,
    data: {
      hotRankList: [{
        itemId: 2026,
        templateMaterial: {
          widgetTitle: '一家公司的新进展',
          widgetImage: 'https://example.com/cover.jpg',
          statRead: 8000,
        },
      }],
    },
  });

  assert.deepEqual(result, [{
    id: 2026,
    title: '一家公司的新进展',
    pic: 'https://example.com/cover.jpg',
    hot: 8000,
    url: 'https://www.36kr.com/p/2026',
    mobileUrl: 'https://m.36kr.com/p/2026',
  }]);
});

test('maps Zhihu Daily stories and preserves their canonical URLs', () => {
  const result = mapZhihuDailyStories({
    stories: [{
      id: 42,
      title: '日报故事',
      url: 'https://daily.zhihu.com/story/42',
      images: ['https://example.com/story.jpg'],
    }],
  });

  assert.deepEqual(result, [{
    id: 42,
    title: '日报故事',
    pic: 'https://example.com/story.jpg',
    url: 'https://daily.zhihu.com/story/42',
    mobileUrl: 'https://daily.zhihu.com/story/42',
  }]);
});

test('rejects structurally invalid upstream responses', () => {
  assert.throws(() => mapWeiboTrends({ ok: 0 }), /Unexpected Weibo/);
  assert.throws(() => mapKr36Ranking({ code: 500 }), /Unexpected 36Kr/);
  assert.throws(() => mapZhihuDailyStories({}), /Unexpected Zhihu Daily/);
});

test('normalizes HTML text and product-manager fallback links', () => {
  assert.equal(decodeHtmlText('设计 Agent &#8211; Miora &amp; Friends'), '设计 Agent – Miora & Friends');
  assert.equal(
    woshipmArticleUrl('', 6433992),
    'https://www.woshipm.com/article/6433992.html',
  );
});

test('removes malformed Hupu link fragments and de-duplicates source items', () => {
  assert.equal(
    sanitizeHupuDescription('讨论内容?>" target="_blank" href="huputiyu://bbs/postImg?x=1&amp;y=2'),
    '讨论内容?',
  );
  assert.deepEqual(
    uniqueBy([{ id: '1' }, { id: '1' }, { id: '2' }], item => item.id),
    [{ id: '1' }, { id: '2' }],
  );
});

test('loads Xiaohongshu without environment configuration', async () => {
  const originalFetch = globalThis.fetch;
  let requestHeaders: HeadersInit | undefined;
  globalThis.fetch = async (_input, init) => {
    requestHeaders = init?.headers;
    return new Response(JSON.stringify({
      code: 0,
      success: true,
      data: {
        items: Array.from({ length: 20 }, (_, index) => ({
          id: index + 1,
          title: `热点 ${index + 1}`,
          score: `${100 - index}w`,
          word_type: index === 0 ? '热' : '无',
        })),
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const result = await xiaohongshuAdapter.load({ signal: AbortSignal.timeout(1_000) });
    const headers = new Headers(requestHeaders);

    assert.equal(result.length, 20);
    assert.equal(result[0]?.title, '热点 1');
    assert.equal(result[0]?.label, '热');
    assert.ok(headers.get('shield'));
    assert.ok(headers.get('xy-platform-info'));
    assert.ok(headers.get('xy-common-params'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
