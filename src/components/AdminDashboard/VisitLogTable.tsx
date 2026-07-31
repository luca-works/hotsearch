'use client';

import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Download,
  HelpCircle,
  Laptop,
  MapPin,
  RefreshCw,
  Search,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';

import type { VisitLog } from '@/lib/visit-store';

type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'bot' | 'other';

type VisitLogTableProps = {
  logs: VisitLog[];
  onRefresh: () => Promise<void>;
  isLoading: boolean;
};

const itemsPerPage = 12;

const lower = (value: string | undefined) => (value || '').toLowerCase();

const getDeviceType = (userAgent: string): DeviceType => {
  const ua = lower(userAgent);

  if (/bot|spider|crawl|slurp|bingpreview|facebookexternalhit/.test(ua)) {
    return 'bot';
  }

  if (/ipad|tablet/.test(ua)) {
    return 'tablet';
  }

  if (/mobile|iphone|android|phone/.test(ua)) {
    return 'mobile';
  }

  if (ua) {
    return 'desktop';
  }

  return 'other';
};

const getBrowserLabel = (userAgent: string) => {
  const ua = userAgent || '';

  if (/Edg\//.test(ua)) return 'Edge';
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/bot|spider|crawl/i.test(ua)) return 'Bot';

  return 'Unknown';
};

const getOsLabel = (userAgent: string) => {
  const ua = userAgent || '';

  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Windows NT/.test(ua)) return 'Windows';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad/.test(ua)) return 'iOS';
  if (/Linux/.test(ua)) return 'Linux';

  return 'Unknown';
};

const formatTime = (value: string) => (
  new Date(value).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
);

const formatLocation = (log: VisitLog) => (
  [log.country, log.province, log.city]
    .filter(Boolean)
    .filter(item => item !== '未知')
    .join(' · ') || '未知'
);

const renderDeviceIcon = (deviceType: DeviceType) => {
  switch (deviceType) {
    case 'desktop':
      return <Laptop className="h-3.5 w-3.5 text-slate-500" />;
    case 'mobile':
      return <Smartphone className="h-3.5 w-3.5 text-indigo-500" />;
    case 'tablet':
      return <Tablet className="h-3.5 w-3.5 text-teal-500" />;
    case 'bot':
      return <Bot className="h-3.5 w-3.5 text-rose-500" />;
    default:
      return <HelpCircle className="h-3.5 w-3.5 text-slate-400" />;
  }
};

const pathBadge = (path: string) => {
  const value = path.toLowerCase();

  if (value === '/' || value === '/index' || value === '/index.html') {
    return {
      label: '首页',
      className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
      dot: 'bg-emerald-500',
    };
  }

  if (value.startsWith('/api/')) {
    return {
      label: '接口',
      className: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
      dot: 'bg-amber-500',
    };
  }

  if (value.includes('/admin')) {
    return {
      label: '后台',
      className: 'border-violet-500/20 bg-violet-500/10 text-violet-600',
      dot: 'bg-violet-500',
    };
  }

  return {
    label: '其他',
    className: 'border-slate-200/60 bg-slate-100/70 text-slate-500',
    dot: 'bg-slate-400',
  };
};

export function VisitLogTable({ logs, onRefresh, isLoading }: VisitLogTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<DeviceType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const enrichedLogs = useMemo(() => logs.map(log => ({
    ...log,
    deviceType: getDeviceType(log.userAgent),
    browser: getBrowserLabel(log.userAgent),
    os: getOsLabel(log.userAgent),
    location: formatLocation(log),
  })), [logs]);

  const filteredLogs = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return enrichedLogs.filter((log) => {
      const matchSearch = !keyword
        || lower(log.ip).includes(keyword)
        || lower(log.location).includes(keyword)
        || lower(log.path).includes(keyword)
        || lower(log.referer).includes(keyword)
        || lower(log.userAgent).includes(keyword);
      const matchDevice = deviceFilter === 'all' || log.deviceType === deviceFilter;

      return matchSearch && matchDevice;
    });
  }, [deviceFilter, enrichedLogs, searchTerm]);

  const totalPages = Math.max(Math.ceil(filteredLogs.length / itemsPerPage), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const handleExportCsv = () => {
    if (!filteredLogs.length) {
      return;
    }

    const headers = ['ID', '访问时间', 'IP', '归属地', '路径', '来源', '浏览器', '系统', 'UA'];
    const rows = filteredLogs.map(log => [
      log.id,
      formatTime(log.visitedAt),
      log.ip,
      log.location,
      log.path,
      log.referer || '直接访问',
      log.browser,
      log.os,
      log.userAgent || '',
    ]);
    const csvContent = `data:text/csv;charset=utf-8,\uFEFF${
      [headers, ...rows]
        .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))
        .join('\n')
    }`;
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `visits_export_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-white/60 bg-white/70 shadow-[0_8px_26px_rgba(15,23,42,0.03)] backdrop-blur-md transition hover:border-indigo-200/60">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-800">最近访问记录详情</h3>
          <p className="mt-1 text-xs font-bold text-slate-400">仅展示当前已记录的访问日志，支持检索、筛选与导出</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!filteredLogs.length}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            导出 CSV
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs font-bold text-indigo-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-5 md:flex-row md:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="搜索 IP、归属地、访问路径、来源或 UA"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm font-bold text-slate-700 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-xs font-bold text-slate-400">终端类型</span>
          <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
            {[
              { id: 'all', name: '全部' },
              { id: 'desktop', name: 'PC' },
              { id: 'mobile', name: '移动' },
              { id: 'bot', name: '爬虫' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setDeviceFilter(item.id as DeviceType | 'all');
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  deviceFilter === item.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50/80 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-5 py-3.5">访问时间</th>
              <th className="whitespace-nowrap px-5 py-3.5">IP 地址</th>
              <th className="whitespace-nowrap px-4 py-3.5 text-center">终端</th>
              <th className="whitespace-nowrap px-5 py-3.5">归属地</th>
              <th className="whitespace-nowrap px-5 py-3.5">路径</th>
              <th className="whitespace-nowrap px-5 py-3.5">渠道来源</th>
              <th className="whitespace-nowrap px-5 py-3.5">浏览器 / UA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
            <AnimatePresence mode="popLayout">
              {paginatedLogs.length ? paginatedLogs.map((log) => {
                const badge = pathBadge(log.path);

                return (
                  <motion.tr
                    key={log.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="align-middle transition hover:bg-slate-50/70"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[10px] text-slate-400">
                      {formatTime(log.visitedAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-slate-800">{log.ip}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                        {renderDeviceIcon(log.deviceType)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-cyan-500" />
                        <span>{log.location}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <div className="flex max-w-[260px] items-center gap-2">
                        <span className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[9px] font-bold ${badge.className}`}>
                          <i className={`mr-1 h-1 w-1 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                        <span className="truncate font-mono text-[11px] text-slate-700" title={log.path}>{log.path}</span>
                      </div>
                    </td>
                    <td className="max-w-[180px] truncate px-5 py-3 text-slate-400" title={log.referer}>
                      {log.referer || '直接访问'}
                    </td>
                    <td className="max-w-[260px] truncate px-5 py-3 text-slate-500" title={log.userAgent}>
                      <span className="mr-1.5 rounded-md border border-slate-100 bg-slate-50 px-1.5 py-0.5 text-slate-700">{log.browser}</span>
                      <span className="text-[11px] text-slate-400">{log.os}</span>
                    </td>
                  </motion.tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="text-sm font-bold text-slate-400">暂无匹配的访问记录</p>
                    <p className="mt-1 text-xs font-bold text-slate-300">当有新的首页访问时会自动显示在这里</p>
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {filteredLogs.length ? (
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 px-5 py-3 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            显示第 <b className="font-mono text-slate-800">{startIndex + 1}</b> 至第{' '}
            <b className="font-mono text-slate-800">{Math.min(startIndex + itemsPerPage, filteredLogs.length)}</b> 条，
            共 <b className="font-mono text-indigo-600">{filteredLogs.length}</b> 条
          </p>
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1}
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>第 <b className="font-mono text-slate-800">{safeCurrentPage}</b> 页 / 共 <b className="font-mono text-slate-800">{totalPages}</b> 页</span>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
