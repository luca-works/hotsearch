import { Lunar } from 'lunar-typescript';

import { AVOIDS, SUITS, THEME_TRANSITION_LOCK_CLASS } from './constants';
import type { LunarAlmanac, ThemeMode } from './types';

export const formatClockValue = (value: number) => String(value).padStart(2, '0');

export const syncDocumentTheme = (nextTheme: ThemeMode) => {
  document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  document.documentElement.classList.toggle('light', nextTheme === 'light');
};

export const unlockThemeTransition = () => {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.documentElement.classList.remove(THEME_TRANSITION_LOCK_CLASS);
    });
  });
};

export const getLunarAndAlmanac = (date: Date): LunarAlmanac => {
  const lunar = Lunar.fromDate(date);
  const seed = date.getFullYear() * 1000 + (date.getMonth() + 1) * 31 + date.getDate();
  const pick = (source: string[], offset: number, count: number) => {
    const result: string[] = [];
    let cursor = offset;

    while (result.length < count) {
      const index = Math.floor(Math.abs(Math.sin(seed + cursor) * 10000)) % source.length;
      const item = source[index];
      if (!result.includes(item)) {
        result.push(item);
      }
      cursor += 17;
    }

    return result;
  };

  return {
    lunarYear: `${lunar.getYearInGanZhi()}年`,
    lunarZodiac: lunar.getYearShengXiao(),
    lunarMonth: `${lunar.getMonthInChinese()}月`,
    lunarDay: lunar.getDayInChinese(),
    suit: pick(SUITS, 5, 3 + (seed % 2)),
    avoid: pick(AVOIDS, 13, 3 + ((seed + 7) % 2)),
  };
};
