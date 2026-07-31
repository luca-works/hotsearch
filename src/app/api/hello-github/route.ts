import { helloGithubAdapter } from '@/lib/hot-sources/adapters/catalog-json';
import { createHotSourceRoute } from '@/lib/hot-sources/route';

export const GET = createHotSourceRoute(helloGithubAdapter);
