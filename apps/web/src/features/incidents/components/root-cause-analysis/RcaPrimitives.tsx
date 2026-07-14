import type { ReactNode } from 'react';
import { Badge } from '../shared/IncidentStatusBadge';
import { TabPanel, formatDate } from '../shared/IncidentTabPrimitives';

export function RcaPanel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <TabPanel title={title}>{subtitle ? <p className="mb-3 text-xs text-slate-500">{subtitle}</p> : null}{children}</TabPanel>;
}

export function RcaEmpty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-cyan-300/20">{text}</div>;
}

export function RcaRows({ rows }: { rows: Array<[string, any]> }) {
  return <div className="grid gap-2">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-b border-slate-200/70 py-1.5 text-xs last:border-0 dark:border-cyan-300/10"><span className="text-slate-500">{label}</span><span className="text-right font-bold">{value ?? '-'}</span></div>)}</div>;
}

export function RcaChecklist({ items }: { items?: any[] }) {
  if (!items?.length) return <RcaEmpty text="No checklist items were returned by the backend." />;
  return <ul className="grid gap-2">{items.map((item) => <li key={item.title} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><div className="flex justify-between gap-2"><span className="font-bold">{item.title}</span><Badge value={item.status ?? 'Incomplete'} /></div>{item.help ? <p className="mt-1 text-slate-500">{item.help}</p> : null}</li>)}</ul>;
}

export function RcaMiniChart({ rows, empty }: { rows?: any[]; empty: string }) {
  if (!rows?.length) return <RcaEmpty text={empty} />;
  const max = Math.max(1, ...rows.map((row) => Number(row.count ?? 0)));
  return <div className="grid gap-2">{rows.map((row) => <div key={row.label} className="text-xs"><div className="mb-1 flex justify-between"><span>{row.label}</span><span className="font-bold">{row.count}</span></div><div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${(Number(row.count ?? 0) / max) * 100}%` }} /></div></div>)}</div>;
}

export function RcaTimeline({ rows, empty }: { rows?: any[]; empty: string }) {
  if (!rows?.length) return <RcaEmpty text={empty} />;
  return <div className="grid gap-2">{rows.map((row) => <div key={row.id ?? row.event_number} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><div className="flex justify-between gap-2"><b>{row.event_title ?? row.status ?? row.event_type}</b><span className="text-slate-500">{formatDate(row.created_at ?? row.updated_at)}</span></div><p className="mt-1 text-slate-500">{row.event_description ?? row.reason ?? row.comments ?? row.notes}</p></div>)}</div>;
}

export function RcaActionButton({ label, onClick, disabled, title, danger = false }: { label: string; onClick?: () => void; disabled?: boolean; title?: string; danger?: boolean }) {
  return <button title={title ?? label} disabled={disabled} onClick={onClick} className={`rounded-md px-2 py-1 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${danger ? 'bg-red-500/10 text-red-700 dark:text-red-200' : 'bg-blue-500/10 text-blue-700 dark:text-blue-200'}`}>{label}</button>;
}

export const factorCategories = ['Human', 'Equipment', 'Process', 'Procedure', 'Training', 'Management System', 'Environment', 'Design', 'Maintenance', 'Organization', 'Other'];
export const evidenceSupportOptions = ['Strong evidence', 'Partial evidence', 'Weak evidence', 'Unsupported assumption', 'Disputed', 'Not determined'];
export const confidenceOptions = ['High', 'Medium', 'Low', 'Disputed'];
