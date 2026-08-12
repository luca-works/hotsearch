export type ThemeMode = 'dark' | 'light';

export type PlatformCategory = 'tech' | 'ent' | 'comm' | 'life';

export type Platform = App.HotListConfig & {
  category: PlatformCategory;
  subtitle: string;
  accentColor: string;
};

export type BoardState = {
  data: App.HotListItem[];
  loading: boolean;
  error?: string;
  updateTime?: string;
  cacheStatus?: NonNullable<App.IResponse['cacheStatus']>;
};

export type LunarAlmanac = {
  lunarYear: string;
  lunarZodiac: string;
  lunarMonth: string;
  lunarDay: string;
  suit: string[];
  avoid: string[];
};
