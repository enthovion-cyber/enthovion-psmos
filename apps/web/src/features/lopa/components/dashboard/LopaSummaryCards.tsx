import { AlertTriangle, CheckCircle2, ClipboardList, Clock, FileWarning, Flame, GitBranch, Layers3, ShieldAlert, Sigma, TimerReset } from 'lucide-react';
import type { LopaSummary } from '../../types/lopa.types';

const cards = [
  ['total', 'Total LOPA Studies', ClipboardList, 'text-blue-300', 'All permitted LOPA records'],
  ['draft', 'Draft', FileWarning, 'text-slate-300', 'Draft studies'],
  ['inPreparation', 'In Preparation', GitBranch, 'text-cyan-300', 'Being prepared'],
  ['inProgress', 'In Progress', TimerReset, 'text-blue-300', 'Active work'],
  ['pendingReview', 'Pending Review', Clock, 'text-amber-300', 'Ready for review'],
  ['pendingApproval', 'Pending Approval', ShieldAlert, 'text-orange-300', 'Awaiting approval'],
  ['approved', 'Approved', CheckCircle2, 'text-emerald-300', 'Approved studies'],
  ['closed', 'Closed', CheckCircle2, 'text-zinc-300', 'Closed records'],
  ['overdue', 'Overdue', AlertTriangle, 'text-red-300', 'Past due open studies'],
  ['revalidationDue', 'Revalidation Due', TimerReset, 'text-yellow-300', 'Due in 90 days'],
  ['createdFromHazop', 'Created from HAZOP', GitBranch, 'text-cyan-300', 'HAZOP-triggered LOPAs'],
  ['manualStudies', 'Manual Studies', ClipboardList, 'text-slate-300', 'Manual source'],
  ['criticalScenarios', 'Critical Scenarios', Flame, 'text-red-300', 'Critical/high severity'],
  ['silRequired', 'SIL Required', Sigma, 'text-violet-300', 'Needs SIL determination'],
  ['silGapOpen', 'SIL Gap Open', AlertTriangle, 'text-red-300', 'Open SIL gaps'],
  ['openLopaActions', 'Open LOPA Actions', Layers3, 'text-blue-300', 'Linked open actions'],
  ['hazopWaitingForLopa', 'HAZOP Waiting for LOPA', ShieldAlert, 'text-orange-300', 'LOPA-required scenarios'],
  ['calculationIncomplete', 'Calculation Incomplete', Sigma, 'text-amber-300', 'Not calculated'],
  ['iplValidationIncomplete', 'IPL Validation Incomplete', ShieldAlert, 'text-amber-300', 'Needs IPL validation']
] as const;

export function LopaSummaryCards({ summary, onFilter }: { summary?: LopaSummary | undefined; onFilter: (key: string) => void }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {cards.map(([key, label, Icon, color, helper]) => (
        <button key={key} onClick={() => onFilter(key)} className="group rounded-xl border border-cyan-300/10 bg-[#0b1d31] p-4 text-left shadow-xl shadow-black/10 transition hover:border-blue-400/30 hover:bg-[#102845]">
          <div className="flex items-start justify-between gap-3">
            <div className={`rounded-lg border border-current/15 bg-current/10 p-2 ${color}`}><Icon size={18} /></div>
            <span className="text-xs text-slate-500">View</span>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{Number((summary as any)?.[key] ?? 0)}</div>
          <div className="text-sm font-semibold text-slate-200">{label}</div>
          <div className="mt-1 text-xs text-slate-500">{helper}</div>
        </button>
      ))}
    </section>
  );
}
