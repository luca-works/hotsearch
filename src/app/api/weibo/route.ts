import { weiboAdapter } from '@/lib/hot-sources/adapters/weibo';
import { createHotSourceRoute } from '@/lib/hot-sources/route';

export const GET = createHotSourceRoute(weiboAdapter);

