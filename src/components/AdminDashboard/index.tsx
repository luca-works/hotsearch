'use client';

import { Activity, Clock, Eye, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';

import { MetricCard } from './MetricCard';
import { TrafficChart } from './TrafficChart';
import { VisitLogTable } from './VisitLogTable';

import type { AdminDashboardData, AdminStatsRange } from '@/lib/visit-store';

type AdminDashboardProps = {
  initialData: AdminDashboardData;
};

const ranges: { label: string; value: AdminStatsRange }[] = [
  { label: '今天', value: 'today' },
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
];

const rangeLabel = (range: AdminStatsRange) => {
  if (range === '30d') {
    return '最近 30 天';
  }

  if (range === '7d') {
    return '最近 7 天';
  }

  return '今天';
};

const formatUpdatedAt = (value: string) => (
  new Date(value).toLocaleTimeString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
);

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const fetchStats = async (range: AdminStatsRange = data.range) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/stats?range=${range}`, {
        credentials: 'same-origin',
      });

      if (response.ok) {
        const nextData = await response.json() as AdminDashboardData;
        setData(nextData);
      }
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      label: `${rangeLabel(data.range)}访问`,
      value: data.rangePv,
      subText: '按 30 分钟会话去重，刷新不会重复计数',
      icon: Eye,
      iconColorClass: 'text-indigo-600',
    },
    {
      label: `${rangeLabel(data.range)}访客`,
      value: data.rangeUv,
      subText: '按 visitor cookie 去重统计独立访客',
      icon: Users,
      iconColorClass: 'text-cyan-600',
    },
    {
      label: '总访问量',
      value: data.totalPv,
      subText: '历史唯一会话累计数量',
      icon: Activity,
      iconColorClass: 'text-teal-600',
    },
    {
      label: '总访客数',
      value: data.totalUv,
      subText: '历史唯一访客 cookie 累计数量',
      icon: ShieldCheck,
      iconColorClass: 'text-slate-700',
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8fafc] px-4 py-8 text-slate-950 md:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 12% 18%, rgba(255,184,108,0.18), transparent 28%), radial-gradient(circle at 85% 12%, rgba(94,234,212,0.20), transparent 30%), radial-gradient(circle at 78% 82%, rgba(147,197,253,0.22), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #eef2ff 45%, #fdf2f8 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0.45)), radial-gradient(rgba(15,23,42,0.08) 1px, transparent 1px)',
          backgroundSize: 'auto, 18px 18px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <header className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/60 bg-white/45 p-4 shadow-[0_10px_36px_rgba(15,23,42,0.03)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100/50 bg-indigo-50/80 text-indigo-600 shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-800">网站访问分析统计大屏</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  更新时间 {formatUpdatedAt(data.generatedAt)}
                </span>
                <span className="inline-flex items-center gap-1 text-teal-600">
                  <i className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  近 5 分钟在线 {data.activeUsersLast5Min}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200/40 bg-slate-100/80 p-0.5 shadow-inner">
              {ranges.map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => void fetchStats(item.value)}
                  disabled={loading}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    data.range === item.value ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void fetchStats(data.range)}
              disabled={loading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>

            <form action="/api/admin/logout" method="post">
              <button
                type="submit"
                className="cursor-pointer rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900"
              >
                退出登录
              </button>
            </form>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(card => (
            <MetricCard key={card.label} {...card} />
          ))}
        </section>

        <TrafficChart data={data} />

        <VisitLogTable
          logs={data.latest}
          onRefresh={() => fetchStats(data.range)}
          isLoading={loading}
        />
      </div>
    </main>
  );
}
