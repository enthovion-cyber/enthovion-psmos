import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export function DashboardPanel({ title, action, actionHref, children, className = '' }: { title: string; action?: string; actionHref?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-cyan-300/10 bg-[#0b1d31]/92 p-3 shadow-2xl shadow-black/20 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {action ? <Link href={actionHref ?? '#'} className="text-xs font-semibold text-blue-300 hover:text-blue-200">{action} <ChevronRight className="inline" size={13} /></Link> : null}
      </div>
      {children}
    </section>
  );
}

export function MiniRow({ label, value, tone = 'text-white' }: { label: ReactNode; value: ReactNode; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-xs">
      <span className="min-w-0 truncate text-slate-400">{label}</span>
      <span className={`shrink-0 text-right font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

export function toneClass(tone?: string) {
  if (tone === 'red' || tone === 'Critical' || tone === 'High') return 'text-red-300 border-red-400/35 bg-red-500/10';
  if (tone === 'amber' || tone === 'Warning' || tone === 'Medium') return 'text-amber-300 border-amber-400/35 bg-amber-500/10';
  if (tone === 'green' || tone === 'Low') return 'text-emerald-300 border-emerald-400/35 bg-emerald-500/10';
  if (tone === 'gray') return 'text-slate-300 border-slate-400/25 bg-slate-500/10';
  return 'text-blue-300 border-blue-400/35 bg-blue-500/10';
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
