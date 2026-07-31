import { requestJson } from '../http.ts';
import type { HotSourceAdapter } from '../types.ts';

type ZhihuDailyStory = {
  id?: string | number;
  title?: string;
  url?: string;
  images?: string[];
};

type ZhihuDailyPayload = {
  stories?: ZhihuDailyStory[];
};

export const mapZhihuDailyStories = (payload: ZhihuDailyPayload): App.HotListItem[] => {
  if (!Array.isArray(payload.stories)) {
    throw new Error('Unexpected Zhihu Daily response shape');
  }

  return payload.stories.flatMap((story, index) => {
    const title = story.title?.trim();
    const url = story.url?.trim();
    if (!title || !url) return [];

    return [{
      id: story.id ?? `zhihu-daily-${index}-${title}`,
      title,
      pic: story.images?.[0],
      url,
      mobileUrl: url,
    }];
  });
};

export const zhihuDailyAdapter: HotSourceAdapter = {
  key: 'zhihu-daily',
  label: '知乎日报',
  async load() {
    const payload = await requestJson<ZhihuDailyPayload>(
      'https://daily.zhihu.com/api/4/news/latest',
      { headers: { Referer: 'https://daily.zhihu.com/' } },
    );
    return mapZhihuDailyStories(payload);
  },
};
