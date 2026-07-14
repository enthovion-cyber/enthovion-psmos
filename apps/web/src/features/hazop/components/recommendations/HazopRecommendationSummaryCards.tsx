'use client';

import { AlertTriangle, CheckCircle2, ClipboardList, Clock, Link2, ShieldAlert } from 'lucide-react';

const cards = [
  ['total', 'Total', ClipboardList, 'text-blue-300'],
  ['open', 'Open', Clock, 'text-blue-300'],
  ['inProgress', 'In Progress', Clock, 'text-amber-300'],
  ['pendingVerification', 'Pending Verification', ShieldAlert, 'text-amber-300'],
  ['closed', 'Closed', CheckCircle2, 'text-emerald-300'],
  ['overdue', 'Overdue', AlertTriangle, 'text-red-300'],
  ['highPriority', 'High Priority', ShieldAlert, 'text-orange-300'],
  ['lopaRelated', 'LOPA Related', ShieldAlert, 'text-purple-300'],
  ['actionsCreated', 'Actions Created', Link2, 'text-cyan-300'],
  ['closureBlockers', 'Closure Blockers', AlertTriangle, 'text-red-300']
] as const;

export function HazopRecommendationSummaryCards({ summary, loading, onFilter }: { summary?: Record<string, any>; loading?: boolean; onFilter?: (key: string) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-3 2xl:grid-cols-5">
      {cards.map(([key, label, Icon, tone]) => (
        <button key={key} onClick={() => onFilter?.(key)} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-left hover:bg-[var(--psm-surface-2)]">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-[var(--psm-muted)]"><span>{label}</span><Icon size={16} className={tone} /></div>
          <div className={`mt-3 text-3xl font-semibold ${tone}`}>{loading ? '...' : summary?.[key] ?? 0}</div>
          <div className="mt-1 text-xs text-[var(--psm-muted)]">Real recommendation register</div>
        </button>
      ))}
    </div>
  );
}
