'use client';

import { Activity, Compass, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

import type { AdminDashboardData, VisitBreakdownItem, VisitChartPoint } from '@/lib/visit-store';

type TrafficChartProps = {
  data: AdminDashboardData;
};

const width = 800;
const height = 240;
const paddingX = 40;
const paddingY = 26;
const graphWidth = width - paddingX * 2;
const graphHeight = height - paddingY * 2;

const makePathString = (points: { x: number; y: number }[]) => {
  if (!points.length) {
    return '';
  }

  return `M ${points[0].x} ${points[0].y} ${points.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ')}`;
};

const makeAreaPathString = (points: { x: number; y: number }[]) => {
  if (!points.length) {
    return '';
  }

  const baseLineY = paddingY + graphHeight;
  return `${makePathString(points)} L ${points[points.length - 1].x} ${baseLineY} L ${points[0].x} ${baseLineY} Z`;
};

function BreakdownPanel({
  title,
  icon: Icon,
  iconClassName,
  items,
  emptyText,
}: {
  title: string;
  icon: typeof Compass;
  iconClassName: string;
  items: VisitBreakdownItem[];
  emptyText: string;
}) {
  return (
    <section className="flex-1 rounded-xl border border-white/60 bg-white/70 p-5 shadow-[0_8px_26px_rgba(15,23,42,0.03)] backdrop-blur-md transition hover:border-indigo-200/60">
      <div className="mb-4 flex items-center gap-2">
        <div className={`rounded-lg p-1.5 ${iconClassName}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.length ? items.map((item, index) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-xs font-bold">
              <span className="truncate font-mono text-slate-600" title={item.label}>{item.label}</span>
              <span className="shrink-0 text-slate-400">
                <b className="font-mono text-slate-700">{item.count}</b> 次
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={index === 0 ? 'h-full rounded-full bg-teal-500' : 'h-full rounded-full bg-cyan-400'}
                style={{ width: `${Math.max(item.percentage, 2)}%` }}
              />
            </div>
          </div>
        )) : (
          <p className="py-6 text-center text-xs font-bold text-slate-400">{emptyText}</p>
        )}
      </div>
    </section>
  );
}

export function TrafficChart({ data }: TrafficChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    x: number;
    y: number;
    data: VisitChartPoint;
  } | null>(null);
  const trendData = data.range === 'today' ? data.hourlyTrends : data.dailyTrends;

  const points = useMemo(() => {
    const maxVal = Math.max(...trendData.map(point => Math.max(point.pv, point.uv, 10)), 20);
    const divisor = Math.max(trendData.length - 1, 1);

    const pv = trendData.map((point, index) => ({
      x: paddingX + (index / divisor) * graphWidth,
      y: paddingY + graphHeight - (point.pv / maxVal) * graphHeight,
      data: point,
    }));
    const uv = trendData.map((point, index) => ({
      x: paddingX + (index / divisor) * graphWidth,
      y: paddingY + graphHeight - (point.uv / maxVal) * graphHeight,
      data: point,
    }));

    return { pv, uv, maxVal };
  }, [trendData]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-white/60 bg-white/70 p-5 shadow-[0_8px_26px_rgba(15,23,42,0.03)] backdrop-blur-md transition hover:border-indigo-200/60 lg:col-span-2">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">网站流量动态趋势</h3>
              <p className="text-xs font-bold text-slate-400">PV 与 UV 按当前范围去重统计</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/60 px-3 py-1 text-xs font-bold text-indigo-600">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            {data.range === 'today' ? '今天 24h 趋势' : data.range === '7d' ? '最近 7 天趋势' : '最近 30 天趋势'}
          </div>
        </div>

        <div className="relative select-none">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible">
            <defs>
              <linearGradient id="adminPvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="adminUvGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingY + ratio * graphHeight;
              return (
                <g key={ratio} className="opacity-50">
                  <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4,4" />
                  <text x={paddingX - 10} y={y + 4} textAnchor="end" className="fill-slate-400 font-mono text-[10px] font-bold">
                    {Math.round(points.maxVal * (1 - ratio))}
                  </text>
                </g>
              );
            })}

            <path d={makeAreaPathString(points.pv)} fill="url(#adminPvGrad)" />
            <path d={makePathString(points.pv)} fill="none" stroke="#4f46e5" strokeLinecap="round" strokeWidth="2.5" />
            <path d={makeAreaPathString(points.uv)} fill="url(#adminUvGrad)" />
            <path d={makePathString(points.uv)} fill="none" stroke="#06b6d4" strokeLinecap="round" strokeWidth="2.5" />

            {points.pv.map((point, index) => (
              <g
                key={`${point.data.label}-${index}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint({ index, x: point.x, y: point.y, data: point.data })}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <rect x={point.x - (graphWidth / trendData.length / 2)} y={paddingY} width={graphWidth / trendData.length} height={graphHeight} fill="transparent" />
                {hoveredPoint?.index === index ? (
                  <line x1={point.x} y1={paddingY} x2={point.x} y2={paddingY + graphHeight} stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3,2" />
                ) : null}
                <circle cx={point.x} cy={point.y} r={hoveredPoint?.index === index ? 5 : 3} fill="#4f46e5" stroke="#fff" strokeWidth="1.5" />
                <circle cx={points.uv[index].x} cy={points.uv[index].y} r={hoveredPoint?.index === index ? 5 : 3} fill="#06b6d4" stroke="#fff" strokeWidth="1.5" />
              </g>
            ))}

            {trendData.map((point, index) => {
              if (data.range === 'today' && index % 3 !== 0 && index !== trendData.length - 1) {
                return null;
              }

              if (data.range !== 'today' && trendData.length > 10 && index % 4 !== 0 && index !== trendData.length - 1) {
                return null;
              }

              const divisor = Math.max(trendData.length - 1, 1);
              const x = paddingX + (index / divisor) * graphWidth;
              return (
                <text key={`${point.label}-label`} x={x} y={paddingY + graphHeight + 16} textAnchor="middle" className="fill-slate-400 font-mono text-[9px] font-bold">
                  {point.label}
                </text>
              );
            })}
          </svg>

          {hoveredPoint ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.1 }}
              className="pointer-events-none absolute z-40 rounded-xl border border-slate-100 bg-slate-900/95 p-3 text-white shadow-xl backdrop-blur-md"
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
                top: `${(hoveredPoint.y / height) * 100 - 24}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <p className="font-mono text-[10px] font-bold text-indigo-200">{hoveredPoint.data.label}</p>
              <div className="mt-1.5 flex gap-4 text-xs">
                <span>PV <b className="font-mono text-indigo-300">{hoveredPoint.data.pv}</b></span>
                <span>UV <b className="font-mono text-cyan-300">{hoveredPoint.data.uv}</b></span>
              </div>
            </motion.div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-end gap-5 text-xs font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5"><i className="h-3 w-5 rounded border border-indigo-600 bg-indigo-600/25" />PV 访问量</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-3 w-5 rounded border border-cyan-500 bg-cyan-500/25" />UV 访客量</span>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <BreakdownPanel title="高访问页面 Top 5" icon={Compass} iconClassName="bg-teal-50 text-teal-600" items={data.paths} emptyText="暂无访问页面统计" />
        <BreakdownPanel title="热门地区分布" icon={Globe} iconClassName="bg-cyan-50 text-cyan-600" items={data.geo} emptyText="暂无地区分布统计" />
      </div>
    </div>
  );
}
