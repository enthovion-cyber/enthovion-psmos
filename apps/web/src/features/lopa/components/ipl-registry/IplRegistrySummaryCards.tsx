'use client';

import { AlertTriangle, Archive, CheckCircle2, ClipboardCheck, FileWarning, Gauge, Shield, Wrench } from 'lucide-react';
import type { IplRegistrySummary } from '../../types/lopa-ipl-registry.types';

const cards = [
  ['total', 'Total IPLs', Shield, 'text-blue-200'],
  ['approved', 'Approved', CheckCircle2, 'text-emerald-200'],
  ['pendingReview', 'Pending Review', ClipboardCheck, 'text-amber-200'],
  ['missingPfd', 'Missing PFD/RRF', Gauge, 'text-red-200'],
  ['validationFailed', 'Validation Failed', AlertTriangle, 'text-red-200'],
  ['missingProofTest', 'Missing Proof Test', Wrench, 'text-amber-200'],
  ['missingDocuments', 'Missing Documents', FileWarning, 'text-amber-200'],
  ['archived', 'Archived', Archive, 'text-slate-300']
] as const;

export function IplRegistrySummaryCards({ summary, onFilter }: { summary?: IplRegistrySummary | undefined; onFilter: (quick: string) => void }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
      {cards.map(([key, label, Icon, tone]) => (
        <button key={key} onClick={() => onFilter(key === 'missingPfd' ? 'missing-pfd' : key === 'validationFailed' ? 'validation-failed' : key === 'missingProofTest' ? 'proof-overdue' : key === 'archived' ? 'archived' : '')} className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4 text-left shadow-xl shadow-black/10 transition hover:border-blue-400/30">
          <div className="flex items-center justify-between">
            <Icon className={tone} size={18} />
            <span className="text-2xl font-black text-white">{summary?.[key] ?? 0}</span>
          </div>
          <div className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
          <div className="mt-1 text-[11px] text-slate-500">Real registry count</div>
        </button>
      ))}
    </section>
  );
}
