import { RegulatoryAuditGapStatusBadge } from '../shared/RegulatoryAuditGapStatusBadge';
import { RegulatoryEmptyState } from '../shared/RegulatoryUi';
import type { RegulatoryAuditMappingGap } from '../types/regulatory-audit-mapping.types';
import { valueText } from './AuditMappingUi';

export function RegulatoryAuditMappingGapTable({ rows }: { rows?: RegulatoryAuditMappingGap[] | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No audit mapping gaps" message="No backend-generated gaps were returned for this filter." />;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-[.14em] text-[var(--psm-muted)]">
          <tr>
            {['Gap', 'Type', 'Severity', 'Status', 'Owner', 'Due Date', 'Universal Action', 'Recommended Fix'].map((h) => (
              <th key={h} className="px-3 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 font-semibold">{valueText(row.gap_code)} - {valueText(row.gap_title)}</td>
              <td className="px-3 py-3">{valueText(row.gap_type)}</td>
              <td className="px-3 py-3">{valueText(row.gap_severity)}</td>
              <td className="px-3 py-3"><RegulatoryAuditGapStatusBadge value={row.gap_status} /></td>
              <td className="px-3 py-3">{valueText(row.owner_user_id, 'Unassigned')}</td>
              <td className="px-3 py-3">{valueText(row.due_date, 'No due date')}</td>
              <td className="px-3 py-3">
                {row.universal_action_id || row.action_foundation_id ? (
                  <a
                    href={`/actions?id=${row.universal_action_id || row.action_foundation_id}`}
                    className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:underline dark:bg-blue-500/20 dark:text-blue-300"
                    title={`Universal Action Center ID: ${row.universal_action_id || row.action_foundation_id}`}
                  >
                    <span>🎯</span> {row.action_number_snapshot || 'Universal Action'}
                  </a>
                ) : (
                  <span className="text-xs text-[var(--psm-muted)]">-</span>
                )}
              </td>
              <td className="px-3 py-3 text-[var(--psm-muted)]">{valueText(row.recommended_fix, 'No recommendation')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
