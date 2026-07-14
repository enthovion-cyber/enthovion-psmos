import type { ReactNode } from 'react';
import { Badge } from './IncidentStatusBadge';

export const buttonPrimary = 'rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50';
export const buttonSecondary = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-300/10 dark:bg-[#0b1b2d]';

export function TabPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525]">
      <h3 className="mb-3 text-sm font-black">{title}</h3>
      {children}
    </section>
  );
}

export function SummaryCardGrid({ cards }: { cards: any[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-cyan-300/10 dark:bg-[#071525]">
          <div className="text-[11px] uppercase text-slate-500">{card.label}</div>
          <div className="mt-1 text-lg font-black">{String(card.value ?? '-')}</div>
          <p className="mt-1 text-xs text-slate-500">{card.help}</p>
        </div>
      ))}
    </div>
  );
}

export function Field({ label, value, onChange, type = 'text', wide = false }: { label: string; value: any; onChange: (value: string) => void; type?: string; wide?: boolean }) {
  return (
    <label className={`grid gap-1 text-xs ${wide ? 'md:col-span-2' : ''}`}>
      <span className="font-bold text-slate-600 dark:text-slate-300">{label}</span>
      <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-400 dark:border-cyan-300/10 dark:bg-[#03111f]" />
    </label>
  );
}

export function SelectField({ label, value, options, onChange }: { label: string; value: any; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs">
      <span className="font-bold text-slate-600 dark:text-slate-300">{label}</span>
      <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-400 dark:border-cyan-300/10 dark:bg-[#03111f]">
        <option value="">Select</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export function TextArea({ label, value, onChange, className = '' }: { label: string; value: any; onChange: (value: string) => void; className?: string }) {
  return (
    <label className={`grid gap-1 text-xs ${className}`}>
      <span className="font-bold text-slate-600 dark:text-slate-300">{label}</span>
      <textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} rows={3} className="rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-400 dark:border-cyan-300/10 dark:bg-[#03111f]" />
    </label>
  );
}

export function ReadOnlyFact({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
      <div className="text-slate-500">{label}</div>
      <div className="font-bold">{value ?? '-'}</div>
    </div>
  );
}

export function ToggleGrid({ form, set, keys }: { form: any; set: (key: string, value: any) => void; keys: Array<[string, string]> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {keys.map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
          <input type="checkbox" checked={!!form[key]} onChange={(event) => set(key, event.target.checked)} />
          {label}
        </label>
      ))}
    </div>
  );
}

export function InfoRows({ rows }: { rows: Array<[string, any]> }) {
  return (
    <div className="grid gap-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 border-b border-slate-200/70 py-1.5 text-xs last:border-0 dark:border-cyan-300/10">
          <span className="text-slate-500">{label}</span>
          <span className="text-right font-bold">{String(value ?? '-')}</span>
        </div>
      ))}
    </div>
  );
}

export function ReadinessContent({ readiness }: { readiness: any }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <Badge value={readiness?.status ?? 'Unknown'} />
        <span className="text-sm font-black">{readiness?.score ?? 0}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full bg-blue-500" style={{ width: `${readiness?.score ?? 0}%` }} />
      </div>
      {readiness?.configWarnings?.map((warning: string) => (
        <div key={warning} className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-200">{warning}</div>
      ))}
      <ul className="grid gap-1 text-xs">
        {(readiness?.checklist ?? []).map((item: any) => (
          <li key={item.title} className="flex justify-between gap-2">
            <span>{item.title}</span>
            <Badge value={item.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TimelineList({ rows, empty, columns = false }: { rows: any[]; empty: string; columns?: boolean }) {
  if (!rows.length) return <p className="text-xs text-slate-500">{empty}</p>;
  return (
    <div className={`grid gap-2 ${columns ? 'md:grid-cols-2 xl:grid-cols-3' : ''}`}>
      {rows.map((row) => (
        <div key={row.id ?? row.event_number} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
          <div className="font-bold">{row.event_title ?? row.event_type}</div>
          <div className="text-slate-500">{row.event_description ?? row.reason ?? ''}</div>
          <div className="mt-1 text-[11px] text-slate-400">{formatDate(row.created_at)}</div>
        </div>
      ))}
    </div>
  );
}

export function TabStatePanel({ title, message, tone = 'info' }: { title: string; message: string; tone?: 'info' | 'danger' }) {
  return (
    <section className={`rounded-xl border p-5 ${tone === 'danger' ? 'border-red-400/25 bg-red-500/10 text-red-700 dark:text-red-200' : 'border-slate-200 bg-white dark:border-cyan-300/10 dark:bg-[#071525]'}`}>
      <h2 className="font-black">{title}</h2>
      <p className="mt-1 text-sm opacity-80">{message}</p>
    </section>
  );
}

export function SeverityCompare({ actual, potential }: { actual: number; potential: number }) {
  const max = 7;
  return (
    <div className="grid gap-3">
      <Bar label="Actual" value={actual} max={max} color="bg-blue-500" />
      <Bar label="Potential" value={potential} max={max} color="bg-red-500" />
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span>{label}</span><span>{value || 'Not set'}</span></div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

export function RiskMatrixVisual({ data }: { data: any }) {
  if (!data?.configured) return <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-200">{data?.missingReason ?? 'Risk matrix configuration is missing.'}</div>;
  const matrix = data.matrix;
  if (!matrix) return <div className="text-xs text-slate-500">Risk matrix configuration exists, but no matrix grid was returned by the backend.</div>;
  return <div className="overflow-auto"><pre className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-cyan-300/10 dark:bg-[#03111f]">{JSON.stringify(matrix, null, 2)}</pre></div>;
}

export function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '-';
}

export function toLocalInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function errorText(error: any) {
  return error?.response?.data?.message ?? error?.message ?? 'Action failed.';
}
