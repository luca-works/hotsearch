import Image from 'next/image';
import { notFound } from 'next/navigation';

import { isLocalStatsEnabled } from '@/lib/features';

export const dynamic = 'force-dynamic';

interface AdminLoginPageProps {
  searchParams?: Promise<{
    error?: string;
  }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  if (!isLocalStatsEnabled()) notFound();

  const params = await searchParams;
  const hasError = params?.error === '1';
  const isRateLimited = params?.error === '2';

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#f8fafc] px-4 py-10 text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(255,184,108,0.18), transparent 28%), radial-gradient(circle at 80% 16%, rgba(94,234,212,0.20), transparent 30%), radial-gradient(circle at 72% 82%, rgba(147,197,253,0.22), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 45%, #fdf2f8 100%)',
        }}
      />
      <section className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-orange-100/70 bg-orange-50/70 shadow-sm">
            <Image src="/icon0.svg" alt="摸鱼热榜" width={28} height={28} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-800">访问记录后台</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">输入管理员密钥后查看网站访问分析大屏。</p>
          </div>
        </div>

        <form action="/api/admin/login" method="post" className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-600">管理员密钥</span>
            <input
              name="token"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              required
            />
          </label>

          {hasError || isRateLimited ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600">
              {isRateLimited ? '尝试次数过多，请稍后再试。' : '密钥不正确，请重新输入。'}
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full cursor-pointer rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500"
          >
            登录后台
          </button>
        </form>
      </section>
    </main>
  );
}
