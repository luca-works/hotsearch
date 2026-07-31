'use client';

import { Check, RotateCcw, Search, Settings2, SlidersHorizontal, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

import { filterPlatformsByLabel, groupPlatforms } from './dashboard-model';
import type { Platform, PlatformCategory, ThemeMode } from './types';

interface PlatformDirectoryProps {
  activeValue?: string;
  homePlatformValues: string[];
  onClose: () => void;
  onHomePlatformsChange: (values: string[]) => void;
  onManage: () => void;
  onPlatformGroupChange: (value: string, category: PlatformCategory) => void;
  onResetPlatformGroups: () => void;
  onSelect: (value: string) => void;
  open: boolean;
  platforms: Platform[];
  theme: ThemeMode;
}

const CATEGORY_LABELS: Record<string, string> = {
  news: '新闻资讯',
  community: '社区热议',
  video: '视频娱乐',
  tech: '科技数码',
  life: '生活消费',
  other: '其他平台',
};

const RECENT_PLATFORMS_KEY = 'hotsearch-recent-platforms';

export function PlatformDirectory({
  activeValue,
  homePlatformValues,
  onClose,
  onHomePlatformsChange,
  onManage,
  onPlatformGroupChange,
  onResetPlatformGroups,
  onSelect,
  open,
  platforms,
  theme,
}: PlatformDirectoryProps) {
  const [query, setQuery] = useState('');
  const [isGrouping, setIsGrouping] = useState(false);
  const [editGroup, setEditGroup] = useState<'home' | PlatformCategory>('home');
  const [recentValues, setRecentValues] = useState<string[]>(() => {
    if (typeof window === 'undefined') return activeValue ? [activeValue] : [];
    try {
      const saved = JSON.parse(window.localStorage.getItem(RECENT_PLATFORMS_KEY) || '[]') as string[];
      return activeValue ? [activeValue, ...saved.filter(value => value !== activeValue)].slice(0, 4) : saved.slice(0, 4);
    } catch {
      return activeValue ? [activeValue] : [];
    }
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const dark = theme === 'dark';
  const groups = useMemo(
    () => groupPlatforms(filterPlatformsByLabel(platforms, query)),
    [platforms, query],
  );
  const recentPlatforms = useMemo(
    () => recentValues.map(value => platforms.find(platform => platform.value === value)).filter((platform): platform is Platform => Boolean(platform)).slice(0, 4),
    [platforms, recentValues],
  );

  const selectPlatform = (value: string) => {
    const next = [value, ...recentValues.filter(item => item !== value)].slice(0, 4);
    setRecentValues(next);
    try {
      window.localStorage.setItem(RECENT_PLATFORMS_KEY, JSON.stringify(next));
    } catch {
      // Browsing still works when storage is unavailable.
    }
    onSelect(value);
  };

  const toggleEditedPlatform = (platform: Platform) => {
    if (editGroup === 'home') {
      if (homePlatformValues.includes(platform.value)) {
        if (homePlatformValues.length > 1) onHomePlatformsChange(homePlatformValues.filter(value => value !== platform.value));
      } else if (homePlatformValues.length < 6) {
        onHomePlatformsChange([...homePlatformValues, platform.value]);
      }
      return;
    }
    onPlatformGroupChange(platform.value, editGroup);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="absolute inset-x-0 top-full z-50 px-3 pt-2 md:px-6">
      <div
        ref={panelRef}
        role="dialog"
        aria-label="全部平台"
        className={`mx-auto flex max-h-[calc(100vh-204px)] max-w-[960px] flex-col overflow-hidden rounded-[24px] border shadow-[0_28px_80px_rgba(15,23,42,0.2)] md:max-h-[calc(100vh-88px)] ${
          dark ? 'border-white/[0.1] bg-[#101520]' : 'border-white bg-[#fbfaf7]'
        }`}
      >
        <div className={`flex items-center gap-3 border-b p-4 ${dark ? 'border-white/[0.07]' : 'border-slate-200/70'}`}>
          <div>
            <h2 className={`text-base font-black ${dark ? 'text-white' : 'text-slate-900'}`}>全部平台</h2>
            <p className={`mt-0.5 text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>按内容类型查找并切换平台</p>
          </div>
          <label className={`relative ml-auto hidden h-10 w-full max-w-xs items-center sm:flex ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            <Search className="pointer-events-none absolute left-3.5 size-4" />
            <span className="sr-only">搜索平台</span>
            <input
              autoFocus
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="搜索平台"
              className={`h-full w-full rounded-xl border pl-10 pr-3 text-xs font-semibold outline-none ${
                dark ? 'border-white/[0.08] bg-white/[0.04] text-white' : 'border-slate-200 bg-white text-slate-800'
              }`}
            />
          </label>
          <button type="button" onClick={onClose} title="关闭全部平台" className={iconButtonClass(dark)}>
            <X className="size-4" />
          </button>
        </div>

        <label className={`relative mx-4 mt-4 flex h-10 items-center sm:hidden ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          <Search className="pointer-events-none absolute left-3.5 size-4" />
          <span className="sr-only">搜索平台</span>
          <input
            autoFocus
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="搜索平台"
            className={`h-full w-full rounded-xl border pl-10 pr-3 text-xs font-semibold outline-none ${
              dark ? 'border-white/[0.08] bg-white/[0.04] text-white' : 'border-slate-200 bg-white text-slate-800'
            }`}
          />
        </label>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {isGrouping ? (
            <section>
              <div className={`mb-4 flex gap-1 overflow-x-auto rounded-xl p-1 ${dark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                {([
                  { value: 'home', label: '首页' },
                  { value: 'comm', label: '综合' },
                  { value: 'tech', label: '科技' },
                  { value: 'ent', label: '娱乐' },
                  { value: 'life', label: '生活' },
                ] as Array<{ value: 'home' | PlatformCategory; label: string }>).map(group => (
                  <button
                    key={group.value}
                    type="button"
                    onClick={() => setEditGroup(group.value)}
                    className={`min-w-[72px] flex-1 cursor-pointer rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                      editGroup === group.value
                        ? dark ? 'bg-white/10 text-white' : 'bg-white text-[#ee6038] shadow-sm'
                        : dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className={`text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {editGroup === 'home' ? '选择首页展示的平台，最多 6 个' : '点击平台，将它移动到当前分组'}
                </p>
                {editGroup === 'home' ? <span className="text-xs font-black text-[#ff6a2c]">{homePlatformValues.length}/6</span> : null}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {platforms.map(platform => {
                  const selected = editGroup === 'home'
                    ? homePlatformValues.includes(platform.value)
                    : platform.category === editGroup;
                  const disabled = editGroup === 'home' && !selected && homePlatformValues.length >= 6;
                  return (
                    <button
                      key={`edit-${platform.value}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleEditedPlatform(platform)}
                      className={`flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-35 ${
                        selected
                          ? dark ? 'border-orange-400/25 bg-orange-400/10 text-orange-200' : 'border-orange-200 bg-orange-50 text-[#df582f]'
                          : dark ? 'border-white/[0.06] text-slate-300 hover:bg-white/[0.05]' : 'border-slate-200/70 bg-white/70 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <Image src={`/${platform.value}.svg`} alt="" width={26} height={26} className="size-[26px] shrink-0 rounded-md" />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold">{platform.label}</span>
                      <span className={`flex size-5 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-[#ff6a2c] text-white' : dark ? 'border border-white/10' : 'border border-slate-200'}`}>
                        {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
          <>
          {!query.trim() && recentPlatforms.length ? (
            <section className="mb-5">
              <h3 className={`mb-2 text-[10px] font-black tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>最近使用</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {recentPlatforms.map(platform => (
                  <PlatformDirectoryButton
                    key={`recent-${platform.value}`}
                    active={platform.value === activeValue}
                    dark={dark}
                    onClick={() => selectPlatform(platform.value)}
                    platform={platform}
                  />
                ))}
              </div>
            </section>
          ) : null}
          {groups.length ? groups.map(group => (
            <section key={group.category} className="mb-5 last:mb-0">
              <h3 className={`mb-2 text-[10px] font-black tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                {CATEGORY_LABELS[group.category] || group.category}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {group.platforms.map(platform => {
                  const active = platform.value === activeValue;
                  return (
                    <PlatformDirectoryButton
                      key={platform.value}
                      active={active}
                      dark={dark}
                      onClick={() => selectPlatform(platform.value)}
                      platform={platform}
                    />
                  );
                })}
              </div>
            </section>
          )) : (
            <div className={`py-12 text-center text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              没有找到匹配的平台
            </div>
          )}
          </>
          )}
        </div>

        <div className={`flex items-center justify-between border-t px-4 py-3 ${dark ? 'border-white/[0.07]' : 'border-slate-200/70'}`}>
          <span className={`text-[10px] font-semibold ${dark ? 'text-slate-600' : 'text-slate-400'}`}>已展示 {platforms.length} 个平台</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                onResetPlatformGroups();
                setEditGroup('home');
              }}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-extrabold transition ${dark ? 'text-slate-500 hover:bg-white/[0.06] hover:text-white' : 'text-slate-400 hover:bg-white hover:text-slate-800'}`}
            >
              <RotateCcw className="size-3.5" />
              重置分类
            </button>
            <button
              type="button"
              onClick={() => {
                setIsGrouping(value => !value);
                setQuery('');
              }}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-extrabold transition ${isGrouping ? 'bg-orange-50 text-[#e75a32]' : dark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
            >
              <SlidersHorizontal className="size-3.5" />
              {isGrouping ? '完成分组' : '自定义分组'}
            </button>
            <button
              type="button"
              onClick={onManage}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-extrabold transition ${dark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
            >
              <Settings2 className="size-3.5" />
              显示管理
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformDirectoryButton({ active, dark, onClick, platform }: { active: boolean; dark: boolean; onClick: () => void; platform: Platform }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
        active
          ? dark
            ? 'border-orange-400/30 bg-orange-400/10 text-white'
            : 'border-orange-200 bg-orange-50 text-slate-900'
          : dark
            ? 'border-white/[0.06] bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]'
            : 'border-slate-200/70 bg-white/70 text-slate-700 hover:border-orange-200 hover:bg-white'
      }`}
    >
      <Image src={`/${platform.value}.svg`} alt="" width={26} height={26} className="size-[26px] shrink-0 rounded-md" />
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-extrabold">{platform.label}</span>
        <span className={`mt-0.5 block truncate text-[9px] ${active ? 'text-emerald-500' : dark ? 'text-slate-600' : 'text-slate-400'}`}>
          {active ? '当前浏览' : platform.tip}
        </span>
      </span>
    </button>
  );
}

function iconButtonClass(dark: boolean) {
  return `flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition ${
    dark ? 'border-white/[0.08] text-slate-400 hover:bg-white/[0.07] hover:text-white' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-900'
  }`;
}
