import type { ThemeMode } from './types';

interface BackgroundDecorProps {
  theme: ThemeMode;
}

export function BackgroundDecor({ theme }: BackgroundDecorProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {theme === 'dark' ? (
        <>
          <div className="absolute left-[5%] top-[8%] z-0 size-[400px] rounded-full bg-[#ff8200]/14 blur-[130px] animate-drift-1" />
          <div className="absolute right-[10%] top-[28%] z-0 size-[450px] rounded-full bg-indigo-600/15 blur-[150px] animate-drift-2" />
          <div className="absolute left-[20%] top-[48%] z-0 size-[380px] rounded-full bg-rose-500/10 blur-[130px] animate-drift-3" />
          <div className="absolute right-[15%] top-[72%] z-0 size-[420px] rounded-full bg-purple-600/14 blur-[140px] animate-drift-1" />
        </>
      ) : (
        <>
          <div className="absolute left-[5%] top-[8%] z-0 size-[400px] rounded-full bg-[#ff8200]/16 blur-[110px] animate-drift-1" />
          <div className="absolute right-[10%] top-[28%] z-0 size-[450px] rounded-full bg-indigo-600/4 blur-[130px] animate-drift-2" />
          <div className="absolute left-[20%] top-[48%] z-0 size-[380px] rounded-full bg-rose-400/6 blur-[115px] animate-drift-3" />
          <div className="absolute right-[15%] top-[72%] z-0 size-[420px] rounded-full bg-purple-500/4 blur-[120px] animate-drift-1" />
        </>
      )}
    </div>
  );
}
