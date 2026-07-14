import type { ReactNode } from 'react';
import { LopaPanel, ProgressBar, TonePill } from '../overview/LopaOverviewShared';

export const fieldClass = 'w-full rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400/50';

export function TeamStatGrid({ cards }: { cards: Array<[string, ReactNode, string?]> }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, tone]) => <button key={label} className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4 text-left transition hover:border-blue-400/30"><div className="text-[11px] uppercase text-slate-500">{label}</div><div className={`mt-2 text-2xl font-black ${tone === 'danger' ? 'text-red-200' : tone === 'warning' ? 'text-amber-200' : tone === 'success' ? 'text-emerald-200' : 'text-white'}`}>{value}</div></button>)}</div>;
}

export function TeamTable({ columns, rows, empty }: { columns: string[]; rows: ReactNode[]; empty: string }) {
  return <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-[11px] uppercase text-slate-500"><tr>{columns.map((column) => <th key={column} className="px-3 py-2">{column}</th>)}</tr></thead><tbody className="divide-y divide-cyan-300/10">{rows.length ? rows : <tr><td className="px-3 py-5 text-slate-400" colSpan={columns.length}>{empty}</td></tr>}</tbody></table></div>;
}

export function ReadinessCard({ title, readiness }: { title: string; readiness: any }) {
  const checks = readiness?.checks ?? [];
  return <LopaPanel title={title}><div className="space-y-3"><div className="flex justify-between text-sm"><b className="text-white">{readiness?.status ?? 'Not Ready'}</b><span className="text-slate-400">{readiness?.percent ?? 0}%</span></div><ProgressBar value={readiness?.percent ?? 0} tone={(readiness?.blockers ?? []).length ? 'danger' : 'success'} />{checks.slice(0, 10).map((check: any) => <div key={check.key ?? check.title} className="flex items-center justify-between rounded-lg border border-cyan-300/10 bg-[#03101d] p-2 text-sm"><span className="text-slate-200">{check.title}</span><TonePill tone={check.status === 'Complete' ? 'success' : check.status === 'Warning' ? 'warning' : 'danger'}>{check.status}</TonePill></div>)}</div></LopaPanel>;
}
