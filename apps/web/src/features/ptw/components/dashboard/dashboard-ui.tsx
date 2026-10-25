import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export function DashboardPanel({
  title,
  action,
  actionHref,
  children,
  className = ''
}: {
  title: string;
  action?: string;
  actionHref?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl transition-all duration-200 ${className}`}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">{title}</h3>
        {action ? (
          <Link
            href={actionHref ?? '#'}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary dark:text-sky-400 hover:text-action-primary-hover dark:hover:text-sky-300 transition-colors"
          >
            {action} <ChevronRight size={12} />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function MiniRow({
  label,
  value,
  tone = 'text-slate-900 dark:text-white'
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-xs">
      <span className="min-w-0 truncate text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`shrink-0 text-right font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

export function toneClass(tone?: string) {
  if (tone === 'red' || tone === 'Critical' || tone === 'High') {
    return 'text-rose-700 dark:text-red-300 border-rose-300 dark:border-red-400/35 bg-rose-50 dark:bg-red-500/10';
  }
  if (tone === 'amber' || tone === 'Warning' || tone === 'Medium') {
    return 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-400/35 bg-amber-50 dark:bg-amber-500/10';
  }
  if (tone === 'green' || tone === 'Low') {
    return 'text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-400/35 bg-emerald-50 dark:bg-emerald-500/10';
  }
  if (tone === 'gray') {
    return 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/40';
  }
  return 'text-sky-700 dark:text-blue-300 border-sky-300 dark:border-blue-400/35 bg-sky-50 dark:bg-blue-500/10';
}

export function formatClock(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function timeLeft(value?: string | null) {
  if (!value) return '-';
  const ms = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(ms)) return '-';
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}
