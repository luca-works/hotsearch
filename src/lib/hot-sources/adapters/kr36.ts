import { requestJson } from '../http.ts';
import type { HotSourceAdapter } from '../types.ts';

type Kr36RankItem = {
  itemId?: string | number;
  templateMaterial?: {
    widgetTitle?: string;
    widgetImage?: string;
    statRead?: number | string;
  };
};

type Kr36Payload = {
  code?: number;
  data?: {
    hotRankList?: Kr36RankItem[];
  };
};

export const mapKr36Ranking = (payload: Kr36Payload): App.HotListItem[] => {
  if (payload.code !== 0 || !Array.isArray(payload.data?.hotRankList)) {
    throw new Error('Unexpected 36Kr response shape');
  }

  return payload.data.hotRankList.flatMap((entry, index) => {
    const title = entry.templateMaterial?.widgetTitle?.trim();
    if (!title) return [];

    const id = entry.itemId ?? `36kr-${index}-${title}`;
    return [{
      id,
      title,
      pic: entry.templateMaterial?.widgetImage,
      hot: entry.templateMaterial?.statRead,
      url: `https://www.36kr.com/p/${id}`,
      mobileUrl: `https://m.36kr.com/p/${id}`,
    }];
  });
};

export const kr36Adapter: HotSourceAdapter = {
  key: '36kr',
  label: '36氪热榜',
  async load() {
    const payload = await requestJson<Kr36Payload>(
      'https://gateway.36kr.com/api/mis/nav/home/nav/rank/hot',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          partner_id: 'wap',
          param: { siteId: 1, platformId: 2 },
          timestamp: Date.now(),
        }),
      },
    );
    return mapKr36Ranking(payload);
  },
};
