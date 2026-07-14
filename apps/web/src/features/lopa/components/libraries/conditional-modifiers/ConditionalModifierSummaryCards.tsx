import { AlertTriangle, Archive, Building2, CheckCircle2, Clock, FileText, PercentCircle } from 'lucide-react';
import type { LopaLibrarySummary } from '../../../types/lopa-library.types';

const cards = [
  ['total', 'Total modifiers', PercentCircle, 'text-blue-300'],
  ['active', 'Active modifiers', CheckCircle2, 'text-emerald-300'],
  ['draft', 'Draft modifiers', FileText, 'text-slate-300'],
  ['pendingApproval', 'Pending approval', Clock, 'text-amber-300'],
  ['approved', 'Approved modifiers', CheckCircle2, 'text-emerald-300'],
  ['archived', 'Archived modifiers', Archive, 'text-zinc-300'],
  ['corporate', 'Corporate records', Building2, 'text-cyan-300'],
  ['siteSpecific', 'Site-specific records', Building2, 'text-violet-300'],
  ['withUncertaintyRange', 'With approved range', PercentCircle, 'text-blue-300'],
  ['needingReview', 'Needing review', AlertTriangle, 'text-orange-300'],
  ['missingSourceReference', 'Missing source reference', AlertTriangle, 'text-red-300']
] as const;

export function ConditionalModifierSummaryCards({ summary, onFilter }: { summary: LopaLibrarySummary | undefined; onFilter: (key: string) => void }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
      {cards.map(([key, label, Icon, color]) => (
        <button key={key} onClick={() => onFilter(key)} className="rounded-xl border border-cyan-300/10 bg-[#0b1d31] p-4 text-left transition hover:border-blue-400/30 hover:bg-[#102845]">
          <div className={`inline-flex rounded-lg border border-current/15 bg-current/10 p-2 ${color}`}><Icon size={16} /></div>
          <div className="mt-3 text-2xl font-black text-white">{Number((summary as any)?.[key] ?? 0)}</div>
          <div className="text-xs font-semibold text-slate-300">{label}</div>
        </button>
      ))}
    </section>
  );
}
