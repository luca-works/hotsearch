export function filterPlatformsByCategory<T extends { category: string }>(
  platforms: readonly (T & { value: string })[],
  activeCategory: string,
): T[] {
  if (activeCategory === 'all') return [...platforms];
  return platforms.filter(platform => platform.category === activeCategory);
}

export function mergePlatformOrder<TValue extends string, T extends { value: TValue }>(
  platforms: readonly T[],
  savedOrder: readonly NoInfer<TValue>[],
): TValue[] {
  const availableValues = new Set<TValue>(platforms.map(platform => platform.value));
  const mergedOrder = savedOrder.filter(value => availableValues.has(value));
  const seenValues = new Set(mergedOrder);

  for (const platform of platforms) {
    if (seenValues.has(platform.value)) continue;
    mergedOrder.push(platform.value);
    seenValues.add(platform.value);
  }

  return mergedOrder;
}

const PLATFORM_DIRECTORY_GROUPS = [
  { category: 'news', values: ['toutiao', 'qq', 'netease', 'thepaper', '36kr', 'zhihu-daily'] },
  { category: 'community', values: ['weibo', 'zhihu', 'baidutieba', 'hupu', 'douban-movic'] },
  { category: 'video', values: ['bilibili', 'douyin', 'kuaishou', 'lol', 'netease-music'] },
  { category: 'tech', values: ['juejin', 'github-trending', 'hello-github', 'csdn', 'ithome', 'ifanr', 'huxiu'] },
  { category: 'life', values: ['xiaohongshu', 'dongchedi', 'weread', 'quark', 'baidu', 'history-today', 'woshipm'] },
] as const;

export function filterPlatformsByLabel<T extends { label: string }>(
  platforms: readonly T[],
  query: string,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [...platforms];
  return platforms.filter(platform => platform.label.toLocaleLowerCase().includes(normalizedQuery));
}

export function groupPlatforms<T extends { value: string }>(platforms: readonly T[]) {
  const assignedValues = new Set<string>(PLATFORM_DIRECTORY_GROUPS.flatMap(group => [...group.values]));
  const groups = PLATFORM_DIRECTORY_GROUPS
    .map(group => ({
      category: group.category,
      platforms: platforms.filter(platform => (group.values as readonly string[]).includes(platform.value)),
    }))
    .filter(group => group.platforms.length > 0);
  const uncategorized = platforms.filter(platform => !assignedValues.has(platform.value));
  return uncategorized.length ? [...groups, { category: 'other', platforms: uncategorized }] : groups;
}

export function buildAggregateItems<
  TPlatform extends { label: string; value: string },
  TItem extends { id: string | number; title: string },
>(
  platforms: readonly TPlatform[],
  boards: Readonly<Record<string, { data: readonly TItem[] } | undefined>>,
  limit = 50,
): Array<TItem & { sourcePlatformLabel: string; sourcePlatformValue: string }> {
  const items: Array<TItem & { sourcePlatformLabel: string; sourcePlatformValue: string }> = [];
  const seenTitles = new Set<string>();
  const maxDepth = Math.max(0, ...platforms.map(platform => boards[platform.value]?.data.length || 0));

  for (let depth = 0; depth < maxDepth && items.length < limit; depth += 1) {
    for (const platform of platforms) {
      const item = boards[platform.value]?.data[depth];
      if (!item) continue;
      const normalizedTitle = item.title.trim().toLocaleLowerCase();
      if (!normalizedTitle || seenTitles.has(normalizedTitle)) continue;
      seenTitles.add(normalizedTitle);
      items.push({
        ...item,
        id: `${platform.value}-${depth}-${item.id}`,
        sourcePlatformLabel: platform.label,
        sourcePlatformValue: platform.value,
      });
      if (items.length === limit) break;
    }
  }
  return items;
}

export function resolveActivePlatformValue<T extends { value: string }>(
  platforms: readonly T[],
  activeValue?: string,
): string | undefined {
  if (activeValue && platforms.some(platform => platform.value === activeValue)) {
    return activeValue;
  }
  return platforms[0]?.value;
}

export function resolvePlatformAfterCategoryChange<T extends { category: string; value: string }>(
  platforms: readonly T[],
  category: string,
): string | undefined {
  return filterPlatformsByCategory(platforms, category)[0]?.value;
}

export function filterBoardItems<T extends { title: string }>(
  items: readonly T[],
  query: string,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [...items];

  return items.filter(item => item.title.toLocaleLowerCase().includes(normalizedQuery));
}

export function findItemRank<T extends { id?: unknown; title: string }>(
  items: readonly T[],
  item: T,
): number {
  const referenceIndex = items.indexOf(item);
  if (referenceIndex >= 0) return referenceIndex + 1;

  if (item.id !== null && item.id !== undefined) {
    const idIndex = items.findIndex(candidate => candidate.id === item.id);
    if (idIndex >= 0) return idIndex + 1;
  }

  const titleIndex = items.findIndex(candidate => candidate.title === item.title);
  return titleIndex >= 0 ? titleIndex + 1 : 1;
}

type FocusBoard<TItem> = {
  data: readonly TItem[];
  loading: boolean;
  error?: string;
};

export function buildFocusItems<
  TPlatform extends { value: string },
  TItem extends { title: string },
>(
  platforms: readonly TPlatform[],
  boards: Readonly<Record<string, FocusBoard<TItem> | undefined>>,
  activeValue: string,
  limit = 4,
): Array<{ platform: TPlatform; item: TItem }> {
  const focusItems: Array<{ platform: TPlatform; item: TItem }> = [];

  for (const platform of platforms) {
    if (platform.value === activeValue) continue;
    const item = boards[platform.value]?.data[0];
    if (!item) continue;

    focusItems.push({ platform, item });
    if (focusItems.length === limit) break;
  }

  return focusItems;
}

export type WorkoffState = {
  value: string;
  label: string;
  detail: string;
  status: 'counting' | 'off-work' | 'weekend';
};

export function getWorkoffState(now: Date, offWorkTime = '18:00'): WorkoffState {
  const day = now.getDay();
  if (day === 0 || day === 6) {
    return {
      value: '快乐周末',
      label: '今天不催你下班',
      detail: '尽情享受假期与自由时光',
      status: 'weekend',
    };
  }

  const match = /^(\d{2}):(\d{2})$/.exec(offWorkTime);
  const parsedHour = match ? Number(match[1]) : 18;
  const parsedMinute = match ? Number(match[2]) : 0;
  const validTime = parsedHour >= 0 && parsedHour <= 23 && parsedMinute >= 0 && parsedMinute <= 59;
  const offWorkHour = validTime ? parsedHour : 18;
  const offWorkMinute = validTime ? parsedMinute : 0;
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const offWorkSeconds = offWorkHour * 3600 + offWorkMinute * 60;

  if (currentSeconds >= offWorkSeconds) {
    return {
      value: '已下班',
      label: '今日工作已完成',
      detail: '把时间还给生活',
      status: 'off-work',
    };
  }

  const remainingSeconds = offWorkSeconds - currentSeconds;
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');

  return {
    value: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
    label: '离下班还有一点点',
    detail: `距离周末还有 ${5 - day} 天`,
    status: 'counting',
  };
}
