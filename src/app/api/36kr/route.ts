import { kr36Adapter } from '@/lib/hot-sources/adapters/kr36';
import { createHotSourceRoute } from '@/lib/hot-sources/route';

export const GET = createHotSourceRoute(kr36Adapter);
