/* External payloads and embedded page state do not expose stable schemas. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cheerio from 'cheerio';

import { requestJson, requestText } from '../http.ts';
import type { HotSourceAdapter } from '../types.ts';
import { sanitizeHupuDescription, uniqueBy } from './normalize.ts';

const adapter = (
  key: string,
  label: string,
  load: () => Promise<App.HotListItem[]>,
): HotSourceAdapter => ({ key, label, load });

const requireArray = (value: any, source: string): any[] => {
  if (!Array.isArray(value)) throw new Error(`Unexpected ${source} response shape`);
  return value;
};

const cleanText = (value: unknown) => (
  cheerio.load(String(value || ''), null, false).text().replace(/\s+/g, ' ').trim()
);

export const bilibiliAdapter = adapter('bilibili', '哔哩哔哩热门榜', async () => {
  const body: any = await requestJson(
    'https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all',
    { headers: { Referer: 'https://www.bilibili.com/v/popular/rank/all' } },
  );
  return requireArray(body?.data?.list, 'Bilibili').map((video: any) => ({
    id: video.bvid || video.aid,
    title: video.title,
    desc: video.desc,
    pic: String(video.pic || '').replace(/^http:/, 'https:'),
    hot: video.stat?.view || 0,
    url: video.short_link_v2 || `https://www.bilibili.com/video/${video.bvid}`,
    mobileUrl: `https://m.bilibili.com/video/${video.bvid}`,
  }));
});
bilibiliAdapter.staleIfError = true;

export const douyinAdapter = adapter('douyin', '抖音热点榜', async () => {
  const body: any = await requestJson('https://aweme.snssdk.com/aweme/v1/hot/search/list/');
  return requireArray(body?.data?.word_list, 'Douyin').flatMap((row: any, index) => {
    if (!row.word) return [];
    const id = String(row.sentence_id || row.group_id || index);
    const url = `https://www.douyin.com/hot/${encodeURIComponent(id)}`;
    return [{
      id: row.group_id || id, title: row.word, pic: row.word_cover?.url_list?.[0],
      hot: Number(row.hot_value || 0), url, mobileUrl: url,
    }];
  });
});
douyinAdapter.staleIfError = true;

export const hupuAdapter = adapter('hupu', '虎扑步行街热帖', async () => {
  const html = await requestText('https://bbs.hupu.com/all-gambia');
  const marker = 'window.$$data=';
  const start = html.indexOf(marker);
  if (start < 0) throw new Error('Hupu page state was not found');
  const tail = html.slice(start + marker.length);
  const end = tail.indexOf('</script>');
  if (end < 0) throw new Error('Hupu page state was incomplete');
  const page = JSON.parse(tail.slice(0, end).trim().replace(/;$/, ''));
  return requireArray(page?.pageData?.threads, 'Hupu').map((row: any) => {
    return {
      id: row.tid, title: cleanText(row.title), desc: sanitizeHupuDescription(row.desc), pic: row.cover, tip: row.lights,
      url: `https://bbs.hupu.com${row.url}`, mobileUrl: `https://bbs.hupu.com${row.url}`,
    };
  });
});

export const historyTodayAdapter = adapter('history-today', '历史上的今天', async () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const body: any = await requestJson(`https://baike.baidu.com/cms/home/eventsOnHistory/${month}.json`);
  return requireArray(body?.[month]?.[month + day], 'Baidu History').map((row: any, index) => ({
    id: index, title: String(row.title || '').replace(/<[^>]+>/g, ''),
    tip: row.year, type: row.type, url: row.link, mobileUrl: row.link,
  }));
});

export const xiaohongshuAdapter = adapter('xiaohongshu', '小红书实时热榜', async () => {
  const body: any = await requestJson(
    'https://edith.xiaohongshu.com/api/sns/v1/search/hot_list',
    {
      headers: {
        Referer: 'https://app.xhs.cn/',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.7(0x18000733) NetType/WIFI Language/zh_CN',
        'xy-direction': '22',
        // Public client metadata from the open-source vikiboss/60s Rednote adapter.
        shield: 'XYAAAAAQAAAAEAAABTAAAAUzUWEe4xG1IYD9/c+qCLOlKGmTtFa+lG434Oe+FTRagxxoaz6rUWSZ3+juJYz8RZqct+oNMyZQxLEBaBEL+H3i0RhOBVGrauzVSARchIWFYwbwkV',
        'xy-platform-info': 'platform=iOS&version=8.7&build=8070515&deviceId=C323D3A5-6A27-4CE6-AA0E-51C9D4C26A24&bundle=com.xingin.discover',
        'xy-common-params': 'app_id=ECFAAF02&build=8070515&channel=AppStore&deviceId=C323D3A5-6A27-4CE6-AA0E-51C9D4C26A24&device_fingerprint=20230920120211bd7b71a80778509cf4211099ea911000010d2f20f6050264&device_fingerprint1=20230920120211bd7b71a80778509cf4211099ea911000010d2f20f6050264&device_model=phone&fid=1695182528-0-0-63b29d709954a1bb8c8733eb2fb58f29&gid=7dc4f3d168c355f1a886c54a898c6ef21fe7b9a847359afc77fc24ad&identifier_flag=0&lang=zh-Hans&launch_id=716882697&platform=iOS&project_id=ECFAAF&sid=session.1695189743787849952190&t=1695190591&teenager=0&tz=Asia/Shanghai&uis=light&version=8.7',
      },
    },
  );
  return requireArray(body?.data?.items, 'Xiaohongshu').map((row: any) => {
    const url = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(row.title)}`;
    return {
      id: row.id, title: row.title, hot: row.score,
      label: !row.word_type || row.word_type === '无' ? undefined : row.word_type,
      url, mobileUrl: url,
    };
  });
});

export const doubanMovieAdapter = adapter('douban-movic', '豆瓣电影新片榜', async () => {
  const html = await requestText('https://movie.douban.com/chart/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' },
  });
  const $ = cheerio.load(html);
  return $('.article tr.item').toArray().map((element) => {
    const row = $(element);
    const url = row.find('a').attr('href') || '';
    const id = url.match(/\d+/)?.[0] || url;
    return {
      id, title: row.find('.pl2 a').text().replace(/\s+/g, ' ').trim(),
      desc: row.find('p.pl').text().trim(),
      hot: Number(row.find('span.pl').text().match(/\d+/)?.[0] || 0),
      score: Number(row.find('.rating_nums').text() || 0),
      url, mobileUrl: `https://m.douban.com/movie/subject/${id}/`,
    };
  });
});

const formatStars = (count: number) => count >= 1_000_000
  ? `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  : count >= 1_000
    ? `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`
    : String(count);

export const githubTrendingAdapter = adapter('github-trending', 'GitHub 热门仓库', async () => {
  const $ = cheerio.load(await requestText('https://github.com/trending'));
  return $('article.Box-row').toArray().flatMap((element, index) => {
    const row = $(element);
    const path = row.find('h2 a').attr('href') || row.find('.h3 a').attr('href');
    if (!path) return [];
    const stars = Number(row.find("svg[aria-label='star']").first().parent().text().replace(/[^\d]/g, '') || 0);
    const url = `https://github.com${path}`;
    return [{
      id: path || index, title: path.replace(/^\//, ''), desc: row.find('p').first().text().trim(),
      tip: formatStars(stars), url, mobileUrl: url,
    }];
  });
});

export const ithomeAdapter = adapter('ithome', 'IT之家热榜', async () => {
  const $ = cheerio.load(await requestText('https://m.ithome.com/rankm/'));
  const items = $('.rank-box .placeholder').toArray().flatMap((element) => {
    const row = $(element);
    const href = row.find('a').attr('href');
    const id = href?.match(/(?:html|live)\/(\d+)\.htm/)?.[1];
    if (!href || !id) return [];
    const url = `https://www.ithome.com/0/${id.slice(0, 3)}/${id.slice(3)}.htm`;
    return [{
      id, title: row.find('.plc-title').text().trim(),
      pic: row.find('img').attr('data-original'),
      hot: Number(row.find('.review-num').text().replace(/\D/g, '')),
      url, mobileUrl: url,
    }];
  });
  return uniqueBy(items, item => String(item.id));
});

export const kuaishouAdapter = adapter('kuaishou', '快手热榜', async () => {
  const html = await requestText('https://www.kuaishou.com/?isHome=1', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    },
  });
  const prefix = 'window.__APOLLO_STATE__=';
  const start = html.indexOf(prefix);
  if (start < 0) throw new Error('Kuaishou page state was not found');
  const tail = html.slice(start + prefix.length);
  const end = [tail.indexOf(';(function('), tail.indexOf('</script>')]
    .filter(value => value >= 0).sort((a, b) => a - b)[0];
  if (end === undefined) throw new Error('Kuaishou page state was incomplete');
  const raw = tail.slice(0, end);
  const state: any = JSON.parse(raw.slice(0, raw.lastIndexOf('}') + 1)).defaultClient;
  const refs = state?.['$ROOT_QUERY.visionHotRank({"page":"home"})']?.items
    || state?.['$ROOT_QUERY.visionHotRank({"page":"home","platform":"web"})']?.items;
  return requireArray(refs, 'Kuaishou').flatMap((ref: any) => {
    const row = state?.[ref.id];
    if (!row?.name) return [];
    const videoId = row.photoIds?.json?.[0] || row.poster?.match(/clientCacheKey=([A-Za-z0-9]+)/)?.[1];
    const url = `https://www.kuaishou.com/short-video/${videoId || ''}`;
    const hotText = String(row.hotValue || '');
    const hot = Number.parseFloat(hotText) * (hotText.includes('万') ? 10_000 : 1);
    return [{ id: videoId, title: row.name, hot, url, mobileUrl: url }];
  });
});

export const dongchediAdapter = adapter('dongchedi', '懂车帝热搜', async () => {
  const body: any = await requestJson(
    'https://api.dcarapi.com/motor/pgc_topic/api/topic_rank/api/v1/list',
  );
  return requireArray(body?.data?.topic_rank_list, 'Dongchedi').flatMap((row: any) => {
    if (!row.topic_title) return [];
    const rawUrl = String(row.wap_display_url || '');
    const url = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
    return [{
      id: row.topic_id,
      title: row.topic_title,
      hot: Number(row.hot || 0),
      label: row.tag_name || undefined,
      tip: row.sub_info || undefined,
      url,
      mobileUrl: url,
    }];
  });
});
