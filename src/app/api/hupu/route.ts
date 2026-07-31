import { hupuAdapter } from '@/lib/hot-sources/adapters/catalog-special';
import { createHotSourceRoute } from '@/lib/hot-sources/route';

export const GET = createHotSourceRoute(hupuAdapter);
