import { Activity, AlertTriangle, FileClock, GitBranch, ShieldCheck, Workflow } from 'lucide-react';
import type { HazopHistorySummary } from '../../types/hazop-history.types';

const cards = [
  ['totalEvents', 'Total events', Activity],
  ['eventsToday', 'Today', FileClock],
  ['safetyCriticalEvents', 'Safety-critical', AlertTriangle],
  ['riskChanges', 'Risk changes', ShieldCheck],
  ['attachmentEvents', 'Attachment events', FileClock],
  ['linkedRecordEvents', 'Linked records', GitBranch],
  ['workflowEvents', 'Workflow', Workflow],
  ['systemActions', 'System actions', Activity]
] as const;

export function HazopHistorySummaryCards({ summary, onFilter }: { summary?: HazopHistorySummary; onFilter?: (key: string) => void }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">{cards.map(([key, label, Icon]) => <button key={key} onClick={() => onFilter?.(key)} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-left hover:bg-[var(--psm-surface-2)]"><div className="flex items-center justify-between text-xs text-[var(--psm-muted)]"><span>{label}</span><Icon size={16} /></div><div className="mt-3 text-2xl font-semibold text-sky-200">{Number(summary?.[key] ?? 0)}</div></button>)}</div>;
}
