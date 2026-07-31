'use client';

import type { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

type MetricCardProps = {
  label: string;
  value: number | string;
  subText: string;
  icon: LucideIcon;
  iconColorClass: string;
};

export function MetricCard({
  label,
  value,
  subText,
  icon: Icon,
  iconColorClass,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="group relative flex min-h-[112px] items-center justify-between overflow-hidden rounded-xl border border-white/60 bg-white/55 p-4 shadow-[0_8px_28px_rgba(15,23,42,0.03)] backdrop-blur-md transition hover:border-indigo-200/70 hover:bg-white/70 hover:shadow-[0_12px_32px_rgba(79,70,229,0.06)]"
    >
      <div className="min-w-0 space-y-2">
        <p className="truncate text-xs font-bold text-slate-400">{label}</p>
        <div className="font-mono text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        <p className="line-clamp-2 text-xs font-bold leading-5 text-slate-500">{subText}</p>
      </div>

      <div className={`ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/70 shadow-sm ${iconColorClass}`}>
        <Icon className="h-5 w-5" />
      </div>

      <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-slate-200 transition group-hover:bg-indigo-400" />
    </motion.div>
  );
}
