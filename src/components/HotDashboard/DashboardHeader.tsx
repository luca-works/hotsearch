import { Flame, LayoutGrid, Moon, RefreshCw, Search, Settings, Sun } from 'lucide-react';

import { PlatformDirectory } from './PlatformDirectory';
import type { Platform, PlatformCategory, ThemeMode } from './types';

interface DashboardHeaderProps {
  activeCategory: string;
  activePlatformValue?: string;
  directoryOpen: boolean;
  onCloseDirectory: () => void;
  onCategoryChange: (category: string) => void;
  onOpenDirectory: () => void;
  onOpenCustomize: () => void;
  homePlatformValues: string[];
  onHomePlatformsChange: (values: string[]) => void;
  onPlatformGroupChange: (value: string, category: PlatformCategory) => void;
  onResetPlatformGroups: () => void;
  onPlatformChange: (value: string) => void;
  onRefreshAll: () => void;
  onSearchQueryChange: (query: string) => void;
  onSwitchTheme: () => void;
  searchQuery: string;
  platforms: Platform[];
  theme: ThemeMode;
}

const CATEGORIES = [
  { label: '首页', value: 'all' },
  { label: '综合', value: 'comm' },
  { label: '科技', value: 'tech' },
  { label: '娱乐', value: 'ent' },
  { label: '生活', value: 'life' },
];

export function DashboardHeader({
  activeCategory,
  activePlatformValue,
  directoryOpen,
  onCloseDirectory,
  onCategoryChange,
  onOpenDirectory,
  onOpenCustomize,
  homePlatformValues,
  onHomePlatformsChange,
  onPlatformGroupChange,
  onResetPlatformGroups,
  onPlatformChange,
  onRefreshAll,
  onSearchQueryChange,
  onSwitchTheme,
  searchQuery,
  platforms,
  theme,
}: DashboardHeaderProps) {
  const dark = theme === 'dark';

  return (
    <header
      className={`backdrop-glass sticky top-0 z-40 border-b ${
        dark ? 'border-white/[0.07] bg-[#070a12]/95' : 'border-slate-900/[0.05] bg-white/95 shadow-[0_8px_28px_rgba(30,41,59,0.035)]'
      }`}
    >
      <div className="dashboard-header-inner mx-auto flex max-w-[1536px] flex-wrap items-center gap-3 px-5 py-[18.5px] min-[1181px]:flex-nowrap min-[1181px]:px-10 lg:gap-0">
        <div className="dashboard-brand-group flex min-w-fit items-center gap-1.5 max-md:w-full max-md:justify-center">
          <Flame className="dashboard-brand-icon size-8 text-[#ff451b]" fill="currentColor" strokeWidth={2} aria-hidden="true" />
          <span className={`dashboard-brand text-[28px] font-black tracking-[-0.045em] ${dark ? 'text-white' : 'text-[#11182b]'}`}>摸鱼热榜</span>
        </div>

        <nav
          aria-label="热点分组"
          className={`dashboard-nav order-3 flex w-full items-center border-b md:order-none md:ml-8 md:w-auto md:border-b-0 ${dark ? 'border-white/[0.07]' : 'border-slate-200/70'}`}
        >
          {CATEGORIES.map(category => {
            const active = category.value === activeCategory;
            return (
              <button
                key={category.value}
                type="button"
                aria-pressed={active}
                onClick={() => onCategoryChange(category.value)}
                className={`dashboard-nav-button relative min-h-11 flex-1 cursor-pointer px-3.5 text-[15px] font-extrabold transition-colors md:flex-none ${
                  active
                    ? dark ? 'text-white' : 'text-[#f05a32]'
                    : dark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </nav>

        <div className="dashboard-tools ml-auto mr-[2px] flex min-w-0 items-center gap-[15px] max-md:mx-0 max-md:w-full max-md:justify-center">
          <label
            className={`dashboard-search relative hidden h-[52px] min-w-0 items-center min-[1181px]:flex min-[1181px]:w-[300px] min-[1380px]:w-[420px] ${
              dark ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            <Search className="pointer-events-none absolute left-4 size-4" />
            <span className="sr-only">搜索当前榜单</span>
            <input
              type="search"
              value={searchQuery}
              onChange={event => onSearchQueryChange(event.target.value)}
              placeholder="搜索标题、平台或关键词"
              className={`h-full w-full rounded-2xl border pl-11 pr-4 text-[15px] font-semibold outline-none transition focus:border-[#ff6a2c]/45 focus:ring-4 focus:ring-[#ff6a2c]/10 ${
                dark
                  ? 'border-white/[0.08] bg-white/[0.045] text-white placeholder:text-slate-600'
                  : 'border-slate-900/[0.06] bg-[#f7f8fb] text-slate-800 placeholder:text-slate-400'
              }`}
            />
          </label>
          <button
            type="button"
            aria-expanded={directoryOpen}
            onClick={onOpenDirectory}
            title="全部平台"
            className={toolButtonClass(dark)}
          >
            <LayoutGrid className="size-[18px]" />
          </button>
          <button type="button" onClick={onRefreshAll} title="刷新全部榜单" className={toolButtonClass(dark)}>
            <RefreshCw className="size-[18px]" />
          </button>
          <button type="button" onClick={onOpenCustomize} title="定制专属热榜" className={toolButtonClass(dark)}>
            <Settings className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={onSwitchTheme}
            title={dark ? '切换为明亮模式' : '切换为暗黑模式'}
            className={toolButtonClass(dark)}
          >
            {dark ? <Sun className="size-[18px] text-amber-300" /> : <Moon className="size-[18px] text-indigo-600" />}
          </button>
        </div>

        <label className="relative order-4 flex h-11 w-full items-center text-slate-400 min-[1181px]:hidden">
          <Search className="pointer-events-none absolute left-4 size-4" />
          <span className="sr-only">搜索当前榜单</span>
          <input
            type="search"
            value={searchQuery}
            onChange={event => onSearchQueryChange(event.target.value)}
            placeholder="搜索当前榜单"
            className={`h-full w-full rounded-2xl border pl-11 pr-4 text-sm font-semibold outline-none ${
              dark ? 'border-white/[0.08] bg-white/[0.045] text-white' : 'border-slate-900/[0.07] bg-white/70 text-slate-800'
            }`}
          />
        </label>
      </div>

      {directoryOpen ? (
        <PlatformDirectory
          activeValue={activePlatformValue}
          onClose={onCloseDirectory}
          onManage={() => {
            onCloseDirectory();
            onOpenCustomize();
          }}
          onSelect={onPlatformChange}
          homePlatformValues={homePlatformValues}
          onHomePlatformsChange={onHomePlatformsChange}
          onPlatformGroupChange={onPlatformGroupChange}
          onResetPlatformGroups={onResetPlatformGroups}
          open
          platforms={platforms}
          theme={theme}
        />
      ) : null}
    </header>
  );
}

function toolButtonClass(dark: boolean) {
  return `dashboard-tool-button flex size-[52px] cursor-pointer items-center justify-center rounded-2xl border transition active:scale-95 ${
    dark
      ? 'border-white/[0.08] bg-white/[0.045] text-slate-300 hover:bg-white/[0.08] hover:text-white'
      : 'border-slate-900/[0.06] bg-white text-slate-600 shadow-[0_4px_14px_rgba(30,41,59,0.04)] hover:border-slate-900/[0.1] hover:text-slate-950'
  }`;
}
