import { zhihuDailyAdapter } from '@/lib/hot-sources/adapters/zhihu-daily';
import { createHotSourceRoute } from '@/lib/hot-sources/route';

export const GET = createHotSourceRoute(zhihuDailyAdapter);
