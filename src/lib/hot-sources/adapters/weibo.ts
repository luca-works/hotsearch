import { requestJson } from '../http.ts';
import type { HotSourceAdapter } from '../types.ts';

type WeiboTrend = {
  mid?: string | number;
  word?: string;
  word_scheme?: string;
  num?: number;
  label_name?: string;
};

type WeiboPayload = {
  ok?: number;
  data?: {
    realtime?: WeiboTrend[];
  };
};

export const mapWeiboTrends = (payload: WeiboPayload): App.HotListItem[] => {
  if (payload.ok !== 1 || !Array.isArray(payload.data?.realtime)) {
    throw new Error('Unexpected Weibo response shape');
  }

  return payload.data.realtime.flatMap((trend, index) => {
    const title = trend.word?.trim();
    if (!title) return [];

    const query = trend.word_scheme?.trim() || `#${title}`;
    const url = `https://s.weibo.com/weibo?q=${encodeURIComponent(query)}&t=31&band_rank=1&Refer=top`;

    return [{
      id: trend.mid ?? `weibo-${index}-${title}`,
      title,
      desc: query,
      hot: trend.num,
      label: trend.label_name,
      url,
      mobileUrl: url,
    }];
  });
};

export const weiboAdapter: HotSourceAdapter = {
  key: 'weibo',
  label: '微博热搜',
  async load() {
    const payload = await requestJson<WeiboPayload>(
      'https://weibo.com/ajax/side/hotSearch',
      { headers: { Referer: 'https://weibo.com/' } },
    );
    return mapWeiboTrends(payload);
  },
};
