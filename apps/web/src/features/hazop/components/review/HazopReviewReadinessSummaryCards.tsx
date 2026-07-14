import { AlertTriangle, CheckCircle2, ClipboardCheck, FileWarning, GitBranch, ShieldCheck } from 'lucide-react';
import type { HazopReviewReadiness } from '../../types/hazop-review.types';

const cards = [
  ['progress', 'Readiness progress', CheckCircle2, '%'],
  ['recommendationsOpen', 'Open recommendations', ClipboardCheck, ''],
  ['actionsOpen', 'Open actions', ShieldCheck, ''],
  ['lopaPending', 'LOPA pending', FileWarning, ''],
  ['signoffsPending', 'Pending sign-offs', AlertTriangle, ''],
  ['linkedBlockers', 'Linked blockers', GitBranch, '']
] as const;

export function HazopReviewReadinessSummaryCards({ readiness }: { readiness?: HazopReviewReadiness }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{cards.map(([key, label, Icon, suffix]) => <div key={key} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="flex justify-between text-xs text-[var(--psm-muted)]"><span>{label}</span><Icon size={16} /></div><div className={`mt-3 text-2xl font-semibold ${readiness?.status === 'Blocked' && key !== 'progress' ? 'text-red-200' : 'text-sky-200'}`}>{Number(readiness?.[key] ?? 0)}{suffix}</div></div>)}</div>;
}
