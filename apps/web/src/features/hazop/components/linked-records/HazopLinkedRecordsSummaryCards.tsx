import { AlertTriangle, ClipboardCheck, FileText, GitBranch, Link2, ShieldAlert } from 'lucide-react';
import type { HazopLinkedRecordSummary } from '../../types/hazop-linked-record.types';

const cards = [
  ['totalLinkedRecords', 'Total linked records', Link2, 'text-sky-200'],
  ['linkedMocs', 'MOC links', GitBranch, 'text-purple-200'],
  ['linkedPssrs', 'PSSR links', ClipboardCheck, 'text-emerald-200'],
  ['linkedDocuments', 'Documents / P&IDs', FileText, 'text-cyan-200'],
  ['openBlockers', 'Open blockers', ShieldAlert, 'text-red-200'],
  ['recordsNeedingReview', 'Needs review', AlertTriangle, 'text-amber-200']
] as const;

export function HazopLinkedRecordsSummaryCards({ summary, onFilter }: { summary?: HazopLinkedRecordSummary; onFilter?: (key: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map(([key, label, Icon, tone]) => (
        <button key={key} onClick={() => onFilter?.(key)} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-left transition hover:bg-[var(--psm-surface-2)]">
          <div className="flex items-center justify-between text-xs text-[var(--psm-muted)]"><span>{label}</span><Icon size={16} /></div>
          <div className={`mt-3 text-2xl font-semibold ${tone}`}>{Number(summary?.[key] ?? 0)}</div>
        </button>
      ))}
    </div>
  );
}
