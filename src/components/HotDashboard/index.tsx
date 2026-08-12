'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { BackgroundDecor } from './BackgroundDecor';
import { FALLBACK_META, PLATFORM_META, THEME_TRANSITION_LOCK_CLASS } from './constants';
import { CustomizeModal } from './CustomizeModal';
import {
  buildFocusItems,
  filterPlatformsByCategory,
  mergePlatformOrder,
  resolveActivePlatformValue,
  resolvePlatformAfterCategoryChange,
} from './dashboard-model';
import { DashboardFooter } from './DashboardFooter';
import { DashboardHeader } from './DashboardHeader';
import { DashboardClock, DashboardIntro } from './DashboardIntro';
import { DashboardSidebar } from './DashboardSidebar';
import { FeaturedBoard } from './FeaturedBoard';
import type { BoardState, Platform, PlatformCategory, ThemeMode } from './types';
import {
  formatClockValue,
  syncDocumentTheme,
  unlockThemeTransition,
} from './utils';
import { WorkoffCountdown } from './WorkoffCountdown';

import { VisitTracker } from '@/components/VisitTracker';
import { HOT_ITEMS } from '@/enums';
import { useAppStore } from '@/store/useAppStore';

const formatUpdateTime = (date: Date) => (
  `${formatClockValue(date.getHours())}:${formatClockValue(date.getMinutes())}:${formatClockValue(date.getSeconds())}`
);

const getNextUpdateTime = (result: App.IResponse, previousUpdateTime?: string) => {
  if (result.cachedAt) return formatUpdateTime(new Date(result.cachedAt));
  return previousUpdateTime;
};

const LAST_PLATFORM_KEY = 'hotsearch-last-platform';
const HOME_PLATFORMS_KEY = 'hotsearch-home-platforms';
const PLATFORM_GROUPS_KEY = 'hotsearch-platform-groups';
type HotKey = App.HotListConfig['value'];
const DEFAULT_HOME_PLATFORMS: HotKey[] = ['weibo', 'toutiao', 'zhihu', 'douyin', 'bilibili', 'xiaohongshu'];

export default function HotDashboard({ enableVisitStats = false }: { enableVisitStats?: boolean }) {
  const [theme, setTheme] = useState<ThemeMode>(process.env.NEXT_PUBLIC_THEME === 'dark' ? 'dark' : 'light');
  const [boards, setBoards] = useState<Record<string, BoardState>>({});
  const [currentClockTime, setCurrentClockTime] = useState('');
  const [currentClockDate, setCurrentClockDate] = useState('');
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePlatformValue, setActivePlatformValue] = useState<string>('weibo');
  const [homePlatformValues, setHomePlatformValues] = useState<HotKey[]>(DEFAULT_HOME_PLATFORMS);
  const [platformGroupOverrides, setPlatformGroupOverrides] = useState<Record<string, PlatformCategory>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const restoredLastPlatform = useRef(false);
  const restoredHomePlatforms = useRef(false);
  const restoredPlatformGroups = useRef(false);
  const requestedPlatforms = useRef(new Set<string>());
  const prefetchedForPlatform = useRef(new Set<string>());

  const hiddenItems = useAppStore(state => state.hiddenItems);
  const sortItems = useAppStore(state => state.sortItems);

  const platforms = useMemo<Platform[]>(() => {
    const rawItems = (HOT_ITEMS.items as Array<{ raw: App.HotListConfig }>).map(({ raw }) => raw);
    const byValue = new Map<HotKey, App.HotListConfig>(rawItems.map(item => [item.value, item]));
    const orderedValues = mergePlatformOrder<HotKey, App.HotListConfig>(rawItems, sortItems);

    return orderedValues
      .map(value => byValue.get(value))
      .filter((item): item is App.HotListConfig => item !== undefined && !hiddenItems.includes(item.value))
      .map(item => {
        const meta = PLATFORM_META[item.value] || FALLBACK_META;
        return { ...item, ...meta, category: platformGroupOverrides[item.value] || meta.category };
      });
  }, [hiddenItems, platformGroupOverrides, sortItems]);

  const homePlatforms = useMemo(() => {
    const byValue = new Map(platforms.map(platform => [platform.value, platform]));
    return homePlatformValues
      .map(value => byValue.get(value))
      .filter((platform): platform is Platform => platform !== undefined)
      .slice(0, 6);
  }, [homePlatformValues, platforms]);

  const categoryPlatforms = useMemo(() => {
    if (activeCategory === 'all') return homePlatforms;
    const groupedPlatforms = filterPlatformsByCategory(platforms, activeCategory);
    if (activeCategory !== 'ent') return groupedPlatforms;
    const homeValues = new Set(homePlatforms.map(platform => platform.value));
    return groupedPlatforms.filter(platform => !homeValues.has(platform.value));
  }, [activeCategory, homePlatforms, platforms]);

  const resolvedActiveValue = resolveActivePlatformValue(categoryPlatforms, activePlatformValue);
  const activePlatform = categoryPlatforms.find(platform => platform.value === resolvedActiveValue);
  const activeState = activePlatform
    ? boards[activePlatform.value] || { data: [], loading: true }
    : { data: [], loading: false };

  const focusItems = useMemo(
    () => resolvedActiveValue ? buildFocusItems(platforms, boards, resolvedActiveValue, 3) : [],
    [boards, platforms, resolvedActiveValue],
  );

  useEffect(() => {
    if (restoredLastPlatform.current || platforms.length === 0) return;
    restoredLastPlatform.current = true;
    try {
      const savedValue = window.localStorage.getItem(LAST_PLATFORM_KEY);
      if (savedValue && platforms.some(platform => platform.value === savedValue)) {
        setActivePlatformValue(savedValue);
      }
    } catch {
      // The homepage still defaults to Weibo when storage is unavailable.
    }
  }, [platforms]);

  useEffect(() => {
    if (restoredPlatformGroups.current) return;
    restoredPlatformGroups.current = true;
    try {
      const savedGroups = JSON.parse(window.localStorage.getItem(PLATFORM_GROUPS_KEY) || '{}') as Record<string, PlatformCategory>;
      const validCategories = new Set<PlatformCategory>(['comm', 'tech', 'ent', 'life']);
      const validGroups = Object.fromEntries(
        Object.entries(savedGroups).filter((entry): entry is [string, PlatformCategory] => validCategories.has(entry[1])),
      );
      setPlatformGroupOverrides(validGroups);
    } catch {
      // Keep built-in platform groups when saved settings are unavailable.
    }
  }, []);

  useEffect(() => {
    if (restoredHomePlatforms.current || platforms.length === 0) return;
    restoredHomePlatforms.current = true;
    try {
      const savedValues = JSON.parse(window.localStorage.getItem(HOME_PLATFORMS_KEY) || '[]') as unknown;
      if (Array.isArray(savedValues)) {
        const availableValues = new Set<string>(platforms.map(platform => platform.value));
        const validValues = savedValues.filter(
          (value): value is HotKey => typeof value === 'string' && availableValues.has(value),
        );
        if (validValues.length) setHomePlatformValues([...new Set(validValues)].slice(0, 6));
      }
    } catch {
      // Keep the default six homepage platforms when saved settings are unavailable.
    }
  }, [platforms]);

  useEffect(() => {
    if (resolvedActiveValue && resolvedActiveValue !== activePlatformValue) {
      setActivePlatformValue(resolvedActiveValue);
      setSearchQuery('');
    }
  }, [activePlatformValue, resolvedActiveValue]);

  useEffect(() => {
    const currentTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    setTheme(currentTheme);
  }, []);

  const switchTheme = () => {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.add(THEME_TRANSITION_LOCK_CLASS);
    syncDocumentTheme(nextTheme);
    flushSync(() => setTheme(nextTheme));
    unlockThemeTransition();
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      setCurrentClockTime(`${formatClockValue(now.getHours())}:${formatClockValue(now.getMinutes())}:${formatClockValue(now.getSeconds())}`);
      setCurrentClockDate(`${now.getFullYear()}年${formatClockValue(now.getMonth() + 1)}月${formatClockValue(now.getDate())}日 ${weekday[now.getDay()]}`);
    };

    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const fetchBoardData = useCallback(async (
    platform: Platform,
    { forceRefresh = false }: { forceRefresh?: boolean } = {},
  ) => {
    setBoards(previous => ({
      ...previous,
      [platform.value]: {
        data: previous[platform.value]?.data || [],
        loading: true,
        error: undefined,
        updateTime: previous[platform.value]?.updateTime,
        cacheStatus: previous[platform.value]?.cacheStatus,
      },
    }));

    try {
      const response = await fetch(
        `/api/${platform.value}${forceRefresh ? '?refresh=1' : ''}`,
        forceRefresh ? { cache: 'no-store' } : undefined,
      );
      const result = await response.json() as App.IResponse;
      if (!response.ok || !Array.isArray(result.data) || result.data.length === 0) {
        throw new Error(result.msg || '获取列表数据失败');
      }

      setBoards(previous => ({
        ...previous,
        [platform.value]: {
          data: result.data || [],
          loading: false,
          updateTime: getNextUpdateTime(result, previous[platform.value]?.updateTime),
          cacheStatus: result.cacheStatus,
        },
      }));
    } catch (error) {
      setBoards(previous => ({
        ...previous,
        [platform.value]: {
          data: previous[platform.value]?.data || [],
          loading: false,
          error: error instanceof Error ? error.message : '无法加载该榜单，请稍后刷新重试',
          updateTime: previous[platform.value]?.updateTime,
          cacheStatus: previous[platform.value]?.cacheStatus,
        },
      }));
    }
  }, []);

  useEffect(() => {
    if (!activePlatform || requestedPlatforms.current.has(activePlatform.value)) return;
    requestedPlatforms.current.add(activePlatform.value);
    void fetchBoardData(activePlatform);
  }, [activePlatform, fetchBoardData]);

  useEffect(() => {
    if (!activePlatform || activeState.loading || activeState.data.length === 0) return;
    if (prefetchedForPlatform.current.has(activePlatform.value)) return;
    prefetchedForPlatform.current.add(activePlatform.value);

    const preloadRelatedPlatforms = () => {
      categoryPlatforms
        .filter(platform => platform.value !== activePlatform.value && !requestedPlatforms.current.has(platform.value))
        .slice(0, 3)
        .forEach(platform => {
          requestedPlatforms.current.add(platform.value);
          void fetchBoardData(platform);
        });
    };

    if ('requestIdleCallback' in window) {
      const idleCallback = window.requestIdleCallback(preloadRelatedPlatforms, { timeout: 1500 });
      return () => window.cancelIdleCallback(idleCallback);
    }

    const preloadTimer = globalThis.setTimeout(preloadRelatedPlatforms, 0);
    return () => globalThis.clearTimeout(preloadTimer);
  }, [activePlatform, activeState.data.length, activeState.loading, categoryPlatforms, fetchBoardData]);

  const handleRefreshAll = async () => {
    const concurrency = 4;
    for (let index = 0; index < platforms.length; index += concurrency) {
      await Promise.all(platforms.slice(index, index + concurrency).map(platform => (
        fetchBoardData(platform, { forceRefresh: true })
      )));
    }
  };
  const rememberPlatform = (value: string) => {
    setActivePlatformValue(value);
    try {
      window.localStorage.setItem(LAST_PLATFORM_KEY, value);
    } catch {
      // Platform switching still works when storage is unavailable.
    }
  };
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setIsDirectoryOpen(false);
    const nextPlatformValue = resolvePlatformAfterCategoryChange(platforms, category);
    if (nextPlatformValue) rememberPlatform(nextPlatformValue);
    setSearchQuery('');
  };
  const handlePlatformChange = (value: string) => {
    const nextPlatform = platforms.find(platform => platform.value === value);
    if (nextPlatform) setActiveCategory(nextPlatform.category);
    rememberPlatform(value);
    setIsDirectoryOpen(false);
    setSearchQuery('');
  };
  const handleBoardPlatformChange = (value: string) => {
    rememberPlatform(value);
    setSearchQuery('');
  };
  const handleHomePlatformsChange = (values: string[]) => {
    const nextValues = [...new Set(values)].slice(0, 6);
    const availableValues = new Set<string>(platforms.map(platform => platform.value));
    const validValues = nextValues.filter((value): value is HotKey => availableValues.has(value));
    setHomePlatformValues(validValues);
    try {
      window.localStorage.setItem(HOME_PLATFORMS_KEY, JSON.stringify(validValues));
    } catch {
      // Homepage selection still works for the current session.
    }
  };
  const handlePlatformGroupChange = (value: string, category: PlatformCategory) => {
    setPlatformGroupOverrides(previous => {
      const next = { ...previous, [value]: category };
      try {
        window.localStorage.setItem(PLATFORM_GROUPS_KEY, JSON.stringify(next));
      } catch {
        // Group editing still works for the current session.
      }
      return next;
    });
  };
  const handleResetPlatformGroups = () => {
    setPlatformGroupOverrides({});
    setHomePlatformValues(DEFAULT_HOME_PLATFORMS);
    try {
      window.localStorage.removeItem(PLATFORM_GROUPS_KEY);
      window.localStorage.setItem(HOME_PLATFORMS_KEY, JSON.stringify(DEFAULT_HOME_PLATFORMS));
    } catch {
      // Reset still applies for the current session.
    }
  };

  const dark = theme === 'dark';

  return (
    <div
      className={`dashboard-shell relative min-h-screen overflow-x-clip font-sans selection:bg-[#ff6a2c]/20 transition-colors duration-300 min-[961px]:flex min-[961px]:h-dvh min-[961px]:flex-col min-[961px]:overflow-hidden ${
        dark ? 'bg-[#070a12] text-slate-100' : 'bg-[#fafafa] text-slate-800'
      }`}
    >
      {enableVisitStats ? <VisitTracker /> : null}
      <BackgroundDecor theme={theme} />

      <DashboardHeader
        activeCategory={activeCategory}
        activePlatformValue={resolvedActiveValue}
        directoryOpen={isDirectoryOpen}
        onCloseDirectory={() => setIsDirectoryOpen(false)}
        onCategoryChange={handleCategoryChange}
        onOpenDirectory={() => setIsDirectoryOpen(open => !open)}
        onOpenCustomize={() => {
          setIsDirectoryOpen(false);
          setIsCustomizeOpen(true);
        }}
        onPlatformChange={handlePlatformChange}
        homePlatformValues={homePlatformValues}
        onHomePlatformsChange={handleHomePlatformsChange}
        onPlatformGroupChange={handlePlatformGroupChange}
        onResetPlatformGroups={handleResetPlatformGroups}
        onRefreshAll={handleRefreshAll}
        onSearchQueryChange={setSearchQuery}
        onSwitchTheme={switchTheme}
        searchQuery={searchQuery}
        platforms={platforms}
        theme={theme}
      />

      <main className="dashboard-main relative z-10 mx-auto w-full max-w-[1536px] px-5 pb-4 pt-4 min-[961px]:min-h-0 min-[961px]:flex-1 min-[961px]:overflow-hidden min-[1181px]:pl-[43px] min-[1181px]:pr-[29px] min-[1181px]:pt-[24px]">
        {categoryPlatforms.length ? (
          <>
            <div className="dashboard-grid grid items-stretch gap-5 min-[961px]:h-full min-[961px]:grid-cols-[minmax(0,1fr)_400px] min-[1181px]:gap-[34px] min-[1280px]:grid-cols-[minmax(0,1fr)_420px]">
              <div className="dashboard-left-column flex min-w-0 flex-col gap-6 min-[961px]:min-h-0">
                <DashboardIntro
                  currentClockDate={currentClockDate}
                  currentClockTime={currentClockTime}
                  theme={theme}
                />
                {activePlatform ? (
                  <FeaturedBoard
                    customizeOptions={activeCategory === 'all' ? platforms : undefined}
                    homePlatformValues={activeCategory === 'all' ? homePlatformValues : undefined}
                    itemLimit={activeCategory === 'all' ? 11 : 12}
                    onHomePlatformsChange={activeCategory === 'all' ? handleHomePlatformsChange : undefined}
                    onPlatformChange={handleBoardPlatformChange}
                    onRefresh={platform => void fetchBoardData(platform, { forceRefresh: true })}
                    platform={activePlatform}
                    platformOptions={categoryPlatforms}
                    searchQuery={searchQuery}
                    state={activeState}
                    theme={theme}
                  />
                ) : null}
              </div>
              <div className="dashboard-right-column flex min-w-0 flex-col gap-6 min-[961px]:min-h-0">
                <div className="dashboard-right-clock-row">
                  <DashboardClock
                    className="dashboard-sidebar-clock"
                    currentClockDate={currentClockDate}
                    currentClockTime={currentClockTime}
                    theme={theme}
                  />
                </div>
                <WorkoffCountdown theme={theme} variant="card" />
                <DashboardSidebar
                  focusItems={focusItems}
                  theme={theme}
                />
              </div>
            </div>
          </>
        ) : (
          <section className={`rounded-[26px] border px-6 py-20 text-center ${dark ? 'border-white/[0.08] bg-white/[0.035]' : 'border-white/90 bg-white/60'}`}>
            <h3 className="text-lg font-black">当前分类没有可见平台</h3>
            <p className={`mt-2 text-sm ${dark ? 'text-slate-500' : 'text-slate-400'}`}>可以在定制面板中重新显示榜单。</p>
            <button type="button" onClick={() => setIsCustomizeOpen(true)} className="mt-5 cursor-pointer rounded-xl bg-[#ff6a2c] px-4 py-2.5 text-xs font-extrabold text-white">
              打开定制面板
            </button>
          </section>
        )}
      </main>

      <DashboardFooter platformsCount={platforms.length} theme={theme} />

      <CustomizeModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        theme={theme}
      />
    </div>
  );
}
