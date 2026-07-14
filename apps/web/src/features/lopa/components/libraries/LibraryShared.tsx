'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export const LIBRARY_STATUS_COLORS: Record<string, string> = {
  Approved: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  Draft: 'border-slate-400/25 bg-slate-500/10 text-slate-200',
  'Pending Review': 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  Rejected: 'border-red-400/30 bg-red-500/10 text-red-200',
  Superseded: 'border-violet-400/30 bg-violet-500/10 text-violet-200',
  Archived: 'border-zinc-400/30 bg-zinc-500/10 text-zinc-200'
};

export function LibraryStatusBadge({ status }: { status?: string | null }) {
  const value = status || 'Draft';
  return <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-black uppercase ${LIBRARY_STATUS_COLORS[value] ?? LIBRARY_STATUS_COLORS.Draft}`}>{value}</span>;
}

export function LibraryScopeBadge({ scope }: { scope?: string | null }) {
  const isSite = scope === 'Site';
  return <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-bold ${isSite ? 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200' : 'border-blue-400/25 bg-blue-500/10 text-blue-200'}`}>{scope || 'Corporate'}</span>;
}

export function LibraryPanel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#071525] shadow-xl shadow-black/10">
      <div className="flex items-center justify-between border-b border-cyan-300/10 px-4 py-3">
        <h2 className="text-sm font-black text-white">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function LibraryField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export const inputClass = 'w-full rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400/50';
export const selectClass = inputClass;

export function LibraryDialog({ title, subtitle, open, onClose, children }: { title: string; subtitle?: string; open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#071525] shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between border-b border-cyan-300/10 p-5">
          <div>
            <h2 className="text-xl font-black text-white">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-lg border border-cyan-300/10 p-2 text-slate-300 transition hover:bg-white/10" aria-label="Close dialog"><X size={18} /></button>
        </div>
        <div className="max-h-[calc(90vh-86px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function LibraryDrawer({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <aside className="ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-cyan-300/10 bg-[#071525] shadow-2xl shadow-black/40">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cyan-300/10 bg-[#071525]/95 p-5 backdrop-blur">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg border border-cyan-300/10 p-2 text-slate-300 transition hover:bg-white/10" aria-label="Close drawer"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3 border-b border-cyan-300/10 py-2 text-sm">
      <div className="text-slate-500">{label}</div>
      <div className="font-semibold text-slate-200">{value || '-'}</div>
    </div>
  );
}
