import type { MiInspectionRecordSummary } from '../types/inspection-record.types';

const cards: Array<[keyof MiInspectionRecordSummary, string]> = [
  ['total', 'Total Records'],
  ['inProgress', 'In Progress'],
  ['submitted', 'Pending Review'],
  ['approved', 'Approved'],
  ['readings', 'UT Readings'],
  ['findings', 'Findings'],
  ['criticalFindings', 'Critical Findings'],
  ['remainingLifeUpdated', 'Remaining Life Updated']
];

export function InspectionRecordSummaryCards({ summary }: { summary?: MiInspectionRecordSummary }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(([key, label]) => (
        <div key={key} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[var(--psm-text)]">{Number(summary?.[key] ?? 0)}</p>
        </div>
      ))}
    </section>
  );
}
