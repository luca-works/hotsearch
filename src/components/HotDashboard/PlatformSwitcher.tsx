import { Check, Grid2X2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { Platform, ThemeMode } from './types';

interface PlatformSwitcherProps {
  activeValue?: string;
  embedded?: boolean;
  maxVisible?: number;
  onChange: (value: string) => void;
  platforms: Platform[];
  theme: ThemeMode;
}

export function PlatformSwitcher({
  activeValue,
  embedded = false,
  maxVisible = 4,
  onChange,
  platforms,
  theme,
}: PlatformSwitcherProps) {
  const dark = theme === 'dark';
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0, width: 360 });

  const visiblePlatforms = useMemo(() => {
    const primary = platforms.slice(0, maxVisible);
    const active = platforms.find(platform => platform.value === activeValue);
    if (!active || primary.some(platform => platform.value === active.value)) return primary;
    return [...primary.slice(0, Math.max(0, maxVisible - 1)), active];
  }, [activeValue, maxVisible, platforms]);

  const overflowPlatforms = useMemo(() => {
    const visibleValues = new Set(visiblePlatforms.map(platform => platform.value));
    return platforms.filter(platform => !visibleValues.has(platform.value));
  }, [platforms, visiblePlatforms]);

  useEffect(() => {
    if (!isMoreOpen) return;
    const updatePosition = () => {
      const button = moreButtonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const width = Math.min(360, window.innerWidth - 24);
      setMenuPosition({
        left: Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)),
        top: rect.bottom + 8,
        width,
      });
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMoreOpen(false);
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMoreOpen]);

  const selectPlatform = (value: string) => {
    onChange(value);
    setIsMoreOpen(false);
  };

  return (
    <section
      aria-label="平台切换"
      className={`dashboard-platform-switcher relative flex items-center px-6 py-1 ${embedded ? 'h-[90px] rounded-none border-x-0 border-t-0' : 'h-[76px] rounded-3xl border'} ${
        dark
          ? 'border-white/[0.08] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
          : embedded
            ? 'border-slate-900/[0.05] bg-transparent shadow-none'
            : 'border-slate-900/[0.05] bg-white/90 shadow-[0_12px_36px_rgba(60,74,106,0.065),inset_0_1px_0_rgba(255,255,255,0.92)]'
      }`}
    >
      <div className="flex min-w-0 flex-1 gap-2">
        {visiblePlatforms.map(platform => (
          <PlatformButton
            key={platform.value}
            active={platform.value === activeValue}
            dark={dark}
            onClick={() => selectPlatform(platform.value)}
            platform={platform}
          />
        ))}
        {overflowPlatforms.length ? (
          <button
            ref={moreButtonRef}
            type="button"
            aria-expanded={isMoreOpen}
            aria-haspopup="menu"
            aria-label={`查看更多平台（${overflowPlatforms.length}）`}
            onClick={() => setIsMoreOpen(open => !open)}
            className={`relative flex min-h-[72px] w-[72px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border text-[11px] font-bold transition active:scale-[0.98] ${
              dark
                ? 'border-white/[0.07] bg-white/[0.035] text-slate-400 hover:bg-white/[0.07] hover:text-white'
                : 'border-slate-900/[0.07] bg-slate-50/80 text-slate-500 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Grid2X2 className="size-[18px]" />
            <span>更多</span>
            <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-[#ff6a2c] px-1 text-[9px] font-black leading-4 text-white">
              {overflowPlatforms.length}
            </span>
          </button>
        ) : null}
      </div>

      {isMoreOpen && overflowPlatforms.length && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="关闭更多平台"
                onClick={() => setIsMoreOpen(false)}
                className="fixed inset-0 z-40 cursor-default bg-transparent"
              />
              <div
                role="menu"
                aria-label="更多平台"
                className={`fixed z-50 grid grid-cols-2 gap-2 rounded-2xl border p-3 shadow-[0_20px_55px_rgba(30,41,59,0.18)] ${
                  dark ? 'border-white/[0.1] bg-[#151a25] text-white' : 'border-slate-200/80 bg-white text-slate-800'
                }`}
                style={menuPosition}
              >
                {overflowPlatforms.map(platform => (
                  <button
                    key={platform.value}
                    type="button"
                    role="menuitem"
                    onClick={() => selectPlatform(platform.value)}
                    className={`flex min-w-0 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      dark ? 'hover:bg-white/[0.07]' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Image src={`/${platform.value}.svg`} alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg" />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-bold">{platform.label}</span>
                    {platform.value === activeValue ? <Check className="size-4 shrink-0 text-emerald-500" /> : null}
                  </button>
                ))}
              </div>
            </>,
            document.body,
          )
        : null}
    </section>
  );
}

function PlatformButton({
  active,
  dark,
  onClick,
  platform,
}: {
  active: boolean;
  dark: boolean;
  onClick: () => void;
  platform: Platform;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`dashboard-platform-button relative flex min-h-[72px] min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border px-4 text-left transition active:scale-[0.98] ${
        active
          ? dark
            ? 'border-white/15 bg-white/[0.09] text-white'
            : 'border-slate-900/[0.08] bg-white text-slate-900 shadow-[0_6px_18px_rgba(64,77,105,0.06)] after:absolute after:inset-x-1 after:-bottom-1 after:h-[3px] after:rounded-full after:bg-[#ff5f35]'
          : dark
            ? 'border-white/[0.06] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
            : 'border-slate-900/[0.07] bg-white/55 text-slate-600 hover:bg-white hover:text-slate-900'
      }`}
    >
      <Image src={`/${platform.value}.svg`} alt="" width={40} height={40} className="dashboard-platform-icon size-10 shrink-0 rounded-xl" />
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-extrabold">{platform.label}</span>
        {active ? <span className="dashboard-platform-status mt-1 block truncate text-[12px] font-semibold text-emerald-500">当前浏览 ›</span> : null}
      </span>
    </button>
  );
}
