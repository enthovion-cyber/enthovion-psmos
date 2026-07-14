'use client';

import type { ReactNode } from 'react';

export function StepShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-5 shadow-2xl shadow-black/20">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Field({ label, children, error, required }: { label: string; children: ReactNode; error?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-300">{label}{required ? <span className="text-red-300"> *</span> : null}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

export const inputClass = 'h-11 w-full rounded-md border border-cyan-300/15 bg-slate-950/45 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-300';
export const textAreaClass = 'min-h-28 w-full rounded-md border border-cyan-300/15 bg-slate-950/45 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-300';

export function ToggleCard({ active, title, detail, onClick }: { active: boolean; title: string; detail?: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-lg border p-3 text-left transition hover:border-blue-300/60 ${active ? 'border-blue-300/70 bg-blue-500/15' : 'border-cyan-300/10 bg-white/[0.03]'}`}><span className="block text-sm font-bold text-white">{title}</span>{detail ? <span className="mt-1 block text-xs text-slate-400">{detail}</span> : null}</button>;
}
