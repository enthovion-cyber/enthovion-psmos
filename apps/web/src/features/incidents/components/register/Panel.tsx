import type { ReactNode } from 'react';
export function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-cyan-300/10 dark:bg-[#071525] dark:shadow-none"><div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="text-sm font-black text-slate-950 dark:text-white">{title}</h2>{subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}</div>{action}</div>{children}</section>;
}
export function Empty({ text = 'No records match the current filters.' }: { text?: string }) { return <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-cyan-300/10">{text}</div>; }
export const inputClass = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-400 dark:border-cyan-300/10 dark:bg-[#071525] dark:text-slate-100';
