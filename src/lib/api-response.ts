import { RESPONSE } from '../enums/response.ts';

type ResponseMeta = Pick<App.IResponse, 'cached' | 'cachedAt' | 'cacheStatus'>;

export const responseSuccess = (
  list: App.HotListItem[],
  meta: ResponseMeta,
): App.IResponse => ({
  msg: RESPONSE.label(RESPONSE.SUCCESS),
  code: RESPONSE.SUCCESS,
  data: list,
  timestamp: Date.now(),
  ...meta,
});

export const responseError = (): App.IResponse => ({
  msg: RESPONSE.label(RESPONSE.ERROR),
  code: RESPONSE.ERROR,
  timestamp: Date.now(),
});
