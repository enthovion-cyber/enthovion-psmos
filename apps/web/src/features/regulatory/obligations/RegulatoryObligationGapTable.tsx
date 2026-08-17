import type { RegulatoryObligationGap } from '../types/regulatory-obligation.types';
import { RegulatoryBadge, RegulatoryButton } from '../shared/RegulatoryUi';

export function RegulatoryObligationGapTable({ rows, onResolve }: { rows?: RegulatoryObligationGap[] | undefined; onResolve?: ((gap: RegulatoryObligationGap) => void) | undefined }) {
  const data = rows ?? [];
  if (!data.length) return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-sm text-[var(--psm-muted)]">No obligation gaps for this filter set.</div>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]"><tr>{['Gap', 'Type', 'Severity', 'Criticality', 'Owner', 'Due Date', 'Status', 'Recommended Fix', 'Actions'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr></thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {data.map((gap) => (
            <tr key={gap.id}>
              <td className="px-3 py-3 font-semibold text-[var(--psm-fg)]">{gap.gap_title}</td>
              <td className="px-3 py-3">{gap.gap_type}</td>
              <td className="px-3 py-3"><RegulatoryBadge tone={gap.severity === 'High' ? 'danger' : gap.severity === 'Medium' ? 'warn' : 'neutral'}>{gap.severity}</RegulatoryBadge></td>
              <td className="px-3 py-3">{gap.criticality ?? 'Not Set'}</td>
              <td className="px-3 py-3">{gap.owner_user_id ?? 'Unassigned'}</td>
              <td className="px-3 py-3">{gap.due_date ? new Date(gap.due_date).toLocaleDateString() : 'Not Set'}</td>
              <td className="px-3 py-3"><RegulatoryBadge tone={gap.gap_status === 'Resolved' ? 'good' : 'warn'}>{gap.gap_status}</RegulatoryBadge></td>
              <td className="max-w-md px-3 py-3 text-[var(--psm-muted)]">{gap.recommended_fix ?? gap.gap_description ?? 'No recommendation entered'}</td>
              <td className="px-3 py-3">{onResolve && gap.gap_status !== 'Resolved' ? <RegulatoryButton variant="secondary" onClick={() => onResolve(gap)}>Resolve</RegulatoryButton> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
