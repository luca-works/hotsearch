/* External APIs do not publish stable schemas; every mapper validates its list before use. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs';

import { requestJson } from '../http.ts';
import type { HotSourceAdapter } from '../types.ts';
import { decodeHtmlText, woshipmArticleUrl } from './normalize.ts';

import { convertMillisecondsToTime, getWereadID } from '@/lib/utils';

const requireList = <T>(value: T[] | undefined, source: string): T[] => {
  if (!Array.isArray(value)) throw new Error(`Unexpected ${source} response shape`);
  return value;
};

const jsonAdapter = (
  key: string,
  label: string,
  load: () => Promise<App.HotListItem[]>,
): HotSourceAdapter => ({ key, label, load });

export const baiduAdapter = jsonAdapter('baidu', '百度热搜', async () => {
  const body: any = await requestJson('https://top.baidu.com/api/board?platform=wise&tab=realtime');
  const rows = requireList(body?.data?.cards?.[0]?.content?.[0]?.content, 'Baidu');
  return rows.map((row: any, index: number) => ({
    id: row.index ?? `baidu-${index}-${row.word}`, title: row.word, label: row.newHotName,
    url: `https://www.baidu.com/s?wd=${encodeURIComponent(row.word)}`,
    mobileUrl: row.url,
  }));
});

export const baiduTiebaAdapter = jsonAdapter('baidutieba', '百度贴吧热议', async () => {
  const body: any = await requestJson('https://tieba.baidu.com/hottopic/browse/topicList');
  const rows = requireList(body?.data?.bang_topic?.topic_list, 'Baidu Tieba');
  return rows.map((row: any) => ({
    id: String(row.topic_id), title: row.topic_name, desc: row.topic_desc,
    pic: row.topic_pic, hot: row.discuss_num, url: row.topic_url, mobileUrl: row.topic_url,
  }));
});

export const csdnAdapter = jsonAdapter('csdn', 'CSDN 热榜', async () => {
  const body: any = await requestJson('https://blog.csdn.net/phoenix/web/blog/hot-rank?page=0&pageSize=100');
  return requireList(body?.data, 'CSDN').map((row: any) => ({
    id: row.articleDetailUrl, title: row.articleTitle, tip: row.pcHotRankScore,
    url: row.articleDetailUrl, mobileUrl: row.articleDetailUrl,
  }));
});

export const helloGithubAdapter = jsonAdapter('hello-github', 'HelloGitHub 精选', async () => {
  const body: any = await requestJson('https://api.hellogithub.com/v1/?sort_by=featured&page=1&rank_by=newest&tid=all');
  return requireList(body?.data, 'HelloGitHub').map((row: any) => ({
    id: row.item_id, title: `${row.name}-${row.title}`, desc: row.summary, hot: row.clicks_total,
    url: `https://hellogithub.com/repository/${row.full_name}`,
    mobileUrl: `https://hellogithub.com/repository/${row.full_name}`,
  }));
});

export const huxiuAdapter = jsonAdapter('huxiu', '虎嗅资讯', async () => {
  const body: any = await requestJson(
    'https://moment-api.huxiu.com/web-v3/moment/feed?platform=www',
    { headers: { Referer: 'https://www.huxiu.com/moment/' } },
  );
  return requireList(body?.data?.moment_list?.datalist, 'Huxiu').map((row: any) => {
    const lines = String(row.content || '').replace(/<br\s*\/?>/gi, '\n')
      .split('\n').map((line: string) => line.trim()).filter(Boolean);
    const id = row.object_id;
    return {
      id, title: String(lines.shift() || '').replace(/。$/, ''), desc: lines.join('\n'),
      tip: row.format_time, url: `https://www.huxiu.com/moment/${id}.html`,
      mobileUrl: `https://m.huxiu.com/moment/${id}.html`,
    };
  });
});

export const ifanrAdapter = jsonAdapter('ifanr', '爱范儿快讯', async () => {
  const body: any = await requestJson('https://sso.ifanr.com/api/v5/wp/buzz/?limit=50&offset=0');
  return requireList(body?.objects, 'iFanr').map((row: any) => ({
    id: row.post_id, title: row.post_title,
    url: row.buzz_original_url || `https://www.ifanr.com/${row.post_id}`,
    mobileUrl: row.buzz_original_url || `https://www.ifanr.com/digest/${row.post_id}`,
  }));
});

export const juejinAdapter = jsonAdapter('juejin', '稀土掘金热榜', async () => {
  const body: any = await requestJson('https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot');
  return requireList(body?.data, 'Juejin').map((row: any) => {
    const id = row.content.content_id;
    return {
      id, title: row.content.title, hot: row.content_counter.hot_rank,
      url: `https://juejin.cn/post/${id}`, mobileUrl: `https://juejin.cn/post/${id}`,
    };
  });
});

export const lolAdapter = jsonAdapter('lol', '英雄联盟公告', async () => {
  const body: any = await requestJson('https://apps.game.qq.com/cmc/zmMcnTargetContentList?page=1&num=50&target=24&source=web_pc');
  return requireList(body?.data?.result, 'League of Legends').map((row: any) => {
    const url = `https://lol.qq.com/news/detail.shtml?docid=${encodeURIComponent(row.iDocID)}`;
    return {
      id: row.iDocID, title: row.sTitle, desc: row.sAuthor, pic: row.sIMG,
      hot: Number(row.iTotalPlay), url, mobileUrl: url,
    };
  });
});

export const neteaseAdapter = jsonAdapter('netease', '网易新闻热榜', async () => {
  const body: any = await requestJson('https://m.163.com/fe/api/hot/news/flow');
  return requireList(body?.data?.list, 'NetEase News').map((row: any) => ({
    id: row.skipID, title: row.title, desc: row._keyword, pic: row.imgsrc,
    url: `https://www.163.com/dy/article/${row.skipID}.html`, mobileUrl: row.url,
  }));
});

export const neteaseMusicAdapter = jsonAdapter('netease-music', '网易云音乐热歌榜', async () => {
  const body: any = await requestJson(
    'https://music.163.com/api/playlist/detail?id=3778678',
    { headers: { Referer: 'https://music.163.com/' } },
  );
  return requireList(body?.result?.tracks, 'NetEase Music').map((row: any) => ({
    id: row.id, title: row.name,
    author: requireList(row.artists, 'NetEase Music artists').map((artist: any) => artist.name).join('/'),
    pic: row.album?.picUrl, tip: convertMillisecondsToTime(row.duration),
    url: `https://music.163.com/#/song?id=${row.id}`,
    mobileUrl: `https://music.163.com/m/song?id=${row.id}`,
  }));
});

export const qqAdapter = jsonAdapter('qq', '腾讯新闻热点', async () => {
  const body: any = await requestJson('https://r.inews.qq.com/gw/event/hot_ranking_list');
  const rows = requireList(body?.idlist?.[0]?.newslist, 'Tencent News').slice(1);
  return rows.map((row: any) => ({
    id: row.id, title: row.title, desc: row.abstract, pic: row.miniProShareImage, hot: row.readCount,
    url: `https://new.qq.com/rain/a/${row.id}`, mobileUrl: `https://view.inews.qq.com/a/${row.id}`,
  }));
});

export const quarkAdapter = jsonAdapter('quark', '夸克今日热点', async () => {
  const body: any = await requestJson('https://iflow.quark.cn/iflow/api/v1/article/aggregation?aggregation_id=16665090098771297825&count=50&bottom_pos=0');
  return requireList(body?.data?.articles, 'Quark').map((row: any) => {
    const url = `https://123.quark.cn/detail?item_id=${row.id}`;
    return { id: row.id, title: row.title, tip: dayjs(row.publish_time).format('HH:mm'), url, mobileUrl: url };
  });
});

export const thePaperAdapter = jsonAdapter('thepaper', '澎湃新闻热榜', async () => {
  const body: any = await requestJson('https://cache.thepaper.cn/contentapi/wwwIndex/rightSidebar');
  return requireList(body?.data?.hotNews, 'The Paper').map((row: any) => ({
    id: row.contId, title: row.name, pic: row.pic, hot: row.praiseTimes,
    url: `https://www.thepaper.cn/newsDetail_forward_${row.contId}`,
    mobileUrl: `https://m.thepaper.cn/newsDetail_forward_${row.contId}`,
  }));
});

export const toutiaoAdapter = jsonAdapter('toutiao', '今日头条热榜', async () => {
  const body: any = await requestJson('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc');
  return requireList(body?.data, 'Toutiao').map((row: any) => ({
    id: row.ClusterId, title: row.Title, pic: row.Image?.url, hot: row.HotValue,
    url: `https://www.toutiao.com/trending/${row.ClusterIdStr}/`,
    mobileUrl: `https://api.toutiaoapi.com/feoffline/amos_land/new/html/main/index.html?topic_id=${row.ClusterIdStr}`,
  }));
});

export const wereadAdapter = jsonAdapter('weread', '微信读书飙升榜', async () => {
  const body: any = await requestJson('https://weread.qq.com/web/bookListInCategory/rising?rank=1');
  return requireList(body?.books, 'WeRead').map((row: any) => {
    const info = row.bookInfo;
    const url = `https://weread.qq.com/web/bookDetail/${getWereadID(info.bookId)}`;
    return {
      id: info.bookId, title: info.title, hot: row.readingCount,
      pic: info.cover?.replace('s_', 't9_'), url, mobileUrl: url,
    };
  });
});

export const woshipmAdapter = jsonAdapter('woshipm', '人人都是产品经理热榜', async () => {
  const body: any = await requestJson('https://www.woshipm.com/api2/app/article/popular/daily');
  return requireList(body?.RESULT, 'Woshipm').map((row: any) => {
    const url = woshipmArticleUrl(row.data.type, row.data.id);
    return {
      id: row.data.id,
      title: decodeHtmlText(row.data.articleTitle),
      desc: decodeHtmlText(row.data.articleSummary),
      hot: row.scores, pic: row.data.imageUrl, url, mobileUrl: url,
    };
  });
});

export const zhihuAdapter = jsonAdapter('zhihu', '知乎热榜', async () => {
  const body: any = await requestJson('https://api.zhihu.com/topstory/hot-list');
  return requireList(body?.data, 'Zhihu').map((row: any) => {
    const id = String(row.card_id).replace('Q_', '');
    const url = `https://www.zhihu.com/question/${id}`;
    return {
      id: row.id, title: row.target.title, pic: row.children?.[0]?.thumbnail,
      hot: Number.parseInt(String(row.detail_text).replace(/[^\d]/g, ''), 10) * 10_000,
      url, mobileUrl: url,
    };
  });
});
