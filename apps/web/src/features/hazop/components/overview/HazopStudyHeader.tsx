'use client';

import { Download, Edit3, FileText, PlayCircle, Star } from 'lucide-react';

function badgeClass(value?: string) {
  if (['Closed', 'Approved', 'Completed'].includes(value ?? '')) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (['High', 'Critical', 'Blocked'].includes(value ?? '')) return 'border-red-500/30 bg-red-500/10 text-red-300';
  if (['Review', 'In Progress', 'In Preparation'].includes(value ?? '')) return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
  return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
}

export function HazopStudyHeader({ header, permissions }: { header: Record<string, any>; permissions: Record<string, boolean> }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-purple-400/30 bg-purple-500/15 text-purple-200">
            <FileText size={28} />
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-primary">{header.studyNumber}</span>
              <span className="text-xs text-[var(--psm-muted)]">/</span>
              <span className="text-xs text-[var(--psm-muted)]">{header.studyType}</span>
              <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${badgeClass(header.status)}`}>{header.status}</span>
              <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${badgeClass(header.priority)}`}>{header.priority}</span>
              {header.site ? <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-300">{header.site}</span> : null}
              {header.readOnly ? <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-[var(--psm-muted)]">Read-only</span> : null}
            </div>
            <h2 className="truncate text-2xl font-semibold text-[var(--psm-text)]">{header.title}</h2>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">{header.subtitle || 'Study scope and process section not captured yet.'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={!permissions.canEdit || header.readOnly} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"><Edit3 size={15} className="mr-2 inline" />Edit</button>
          <button disabled={!permissions.canExport} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"><Download size={15} className="mr-2 inline" />Export</button>
          <button disabled={!permissions.canStartReview || header.readOnly} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><PlayCircle size={15} className="mr-2 inline" />Start Review</button>
          <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm"><Star size={15} /></button>
        </div>
      </div>
    </section>
  );
}
