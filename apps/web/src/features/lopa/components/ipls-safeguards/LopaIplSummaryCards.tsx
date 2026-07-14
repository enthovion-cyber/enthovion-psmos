import { AlertTriangle, CheckCircle2, Database, ShieldCheck } from 'lucide-react';
import type { LopaIplSummary } from '../../types/lopa-ipls-safeguards.types';

const cards: Array<[keyof LopaIplSummary, string, any, string]> = [
  ['totalSafeguards', 'Study Safeguards', ShieldCheck, 'text-cyan-200'],
  ['hazopImported', 'Imported from HAZOP', Database, 'text-blue-200'],
  ['iplCandidates', 'IPL Candidates', ShieldCheck, 'text-violet-200'],
  ['validatedIpls', 'Validated IPLs', CheckCircle2, 'text-emerald-200'],
  ['creditedIpls', 'Credited IPLs', CheckCircle2, 'text-emerald-200'],
  ['failedRejected', 'Failed / Rejected', AlertTriangle, 'text-red-200'],
  ['missingPfdRrf', 'Missing PFD/RRF', AlertTriangle, 'text-amber-200'],
  ['openGaps', 'Open Gaps', AlertTriangle, 'text-orange-200']
];

export function LopaIplSummaryCards({ summary }: { summary: LopaIplSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
      {cards.map(([key, label, Icon, tone]) => (
        <button key={key} className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4 text-left shadow-xl shadow-black/10 transition hover:border-blue-400/30">
          <div className="flex items-center justify-between">
            <Icon size={18} className={tone} />
            {key === 'creditedIpls' && summary.needsRecalculation ? <span className="rounded bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-200">Recalc</span> : null}
          </div>
          <div className="mt-3 text-2xl font-black text-white">{String(summary[key] ?? 0)}</div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
        </button>
      ))}
    </div>
  );
}
