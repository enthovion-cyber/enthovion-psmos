import type { ReactNode } from 'react';
import { OverviewEmptyState } from './OverviewEmptyState';

export function OverviewPanelShell({ title, subtitle, children, action }: { title: string; subtitle?: string | undefined; children: ReactNode; action?: ReactNode | undefined }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525] dark:shadow-none">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-950 dark:text-white">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SnapshotGrid({ data, fields, emptyMessage = 'No data available yet.' }: { data?: Record<string, any> | null | undefined; fields?: Array<[string, string]> | undefined; emptyMessage?: string | undefined }) {
  const entries = fields?.map(([key, label]) => [key, label, data?.[key]] as const)
    ?? Object.entries(data ?? {}).filter(([, value]) => !Array.isArray(value) && typeof value !== 'object').map(([key, value]) => [key, labelize(key), value] as const);
  if (!entries.length) return <OverviewEmptyState message={emptyMessage} />;
  return (
    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
      {entries.map(([key, label, value]) => (
        <div key={key} className="rounded-lg border border-slate-200 p-2 dark:border-cyan-300/10">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
          <div className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">{formatValue(value)}</div>
        </div>
      ))}
    </div>
  );
}

export function MiniBars({ items, emptyMessage = 'No chart data available.' }: { items?: any[] | undefined; emptyMessage?: string | undefined }) {
  const rows = items ?? [];
  if (!rows.length) return <OverviewEmptyState message={emptyMessage} />;
  const max = Math.max(1, ...rows.map((item) => Number(item.count ?? item.value ?? 0)));
  return (
    <div className="grid gap-2">
      {rows.map((item) => {
        const count = Number(item.count ?? item.value ?? 0);
        return (
          <div key={item.label} className="text-xs">
            <div className="flex justify-between gap-2"><span>{item.label}</span><b>{count}</b></div>
            <div className="mt-1 h-2 rounded bg-slate-200 dark:bg-slate-800"><div className="h-2 rounded bg-blue-500" style={{ width: `${(count / max) * 100}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '-';
}

export function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function labelize(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replaceAll('_', ' ').replace(/^./, (m) => m.toUpperCase());
}

export function toneClass(tone?: string) {
  if (tone === 'danger') return 'border-red-400/25 bg-red-500/10 text-red-700 dark:text-red-200';
  if (tone === 'warning') return 'border-amber-400/25 bg-amber-500/10 text-amber-700 dark:text-amber-200';
  if (tone === 'ok') return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200';
  if (tone === 'potential' || tone === 'risk') return 'border-purple-400/25 bg-purple-500/10 text-purple-700 dark:text-purple-200';
  return 'border-slate-200 bg-white text-slate-700 dark:border-cyan-300/10 dark:bg-[#0b1b2d] dark:text-slate-200';
}

export function tabKey(section?: string) {
  return String(section ?? 'overview').toLowerCase().replaceAll(' & ', '-').replaceAll(' / ', '-').replaceAll(' ', '-');
}
