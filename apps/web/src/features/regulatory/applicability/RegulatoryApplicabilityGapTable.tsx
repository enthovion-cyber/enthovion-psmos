import { RegulatoryApplicabilityGapBadge } from '../shared/RegulatoryApplicabilityGapBadge';
import { RegulatoryEmptyState } from '../shared/RegulatoryUi';
export function RegulatoryApplicabilityGapTable({ rows }: { rows?: Array<Record<string, any>> | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No applicability gaps" message="Backend gap checks did not return open applicability gaps for this view." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]">
      <table className="min-w-[900px] w-full text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]">
          <tr>
            <th className="p-3">Type</th>
            <th className="p-3">Title</th>
            <th className="p-3">Severity</th>
            <th className="p-3">Owner</th>
            <th className="p-3">Due</th>
            <th className="p-3">Universal Action</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--psm-line)]">
              <td className="p-3">{row.gap_type}</td>
              <td className="p-3 font-semibold">{row.gap_title}</td>
              <td className="p-3">{row.severity ?? '-'}</td>
              <td className="p-3">{row.owner_user_id ?? '-'}</td>
              <td className="p-3">{row.due_date ? new Date(row.due_date).toLocaleDateString() : '-'}</td>
              <td className="p-3">
                {row.universal_action_id || row.linked_action_id ? (
                  <a
                    href={`/actions?id=${row.universal_action_id || row.linked_action_id}`}
                    className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:underline dark:bg-blue-500/20 dark:text-blue-300"
                    title={`Universal Action ID: ${row.universal_action_id || row.linked_action_id}`}
                  >
                    <span>🎯</span> {row.action_number_snapshot || (String(row.linked_action_id).startsWith('ACT') ? row.linked_action_id : 'Universal Action')}
                  </a>
                ) : (
                  <span className="text-xs text-[var(--psm-muted)]">-</span>
                )}
              </td>
              <td className="p-3"><RegulatoryApplicabilityGapBadge status={row.gap_status} blocking={row.blocking} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
