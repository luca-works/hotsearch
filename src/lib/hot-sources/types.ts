export type HotSourceContext = {
  signal: AbortSignal;
};

export type HotSourceAdapter = {
  key: string;
  label: string;
  cacheTtlMs?: number;
  staleIfError?: boolean;
  load(context: HotSourceContext): Promise<App.HotListItem[]>;
};
