import { RegulatoryCard } from '../shared/RegulatoryUi';
import { RegulatoryComplianceGapSeverityBadge } from '../shared/RegulatoryComplianceGapSeverityBadge';
import { RegulatoryComplianceGapStatusBadge } from '../shared/RegulatoryComplianceGapStatusBadge';
import type { RegulatoryComplianceGap } from '../types/regulatory-compliance.types';

export function RegulatoryComplianceGapTable({ rows }: { rows?: RegulatoryComplianceGap[] | undefined }) {
  return (
    <RegulatoryCard title="Gap Register">
      {rows?.length ? (
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-[.12em] text-[var(--psm-muted)]">
              <tr>
                {['Gap', 'Type', 'Severity', 'Status', 'Owner', 'Due Date', 'Universal Action', 'CAPA', 'Updated'].map((column) => (
                  <th key={column} className="px-3 py-3">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--psm-line)]">
                  <td className="px-3 py-3">
                    <b>{row.gap_number}</b>
                    <div className="text-xs text-[var(--psm-muted)]">{row.gap_title}</div>
                  </td>
                  <td className="px-3 py-3">{row.gap_type}</td>
                  <td className="px-3 py-3"><RegulatoryComplianceGapSeverityBadge severity={row.severity} /></td>
                  <td className="px-3 py-3"><RegulatoryComplianceGapStatusBadge status={row.gap_status} /></td>
                  <td className="px-3 py-3">{row.owner_user_id ?? 'Unassigned'}</td>
                  <td className="px-3 py-3">{row.due_date ? new Date(row.due_date).toLocaleDateString() : 'No due date'}</td>
                  <td className="px-3 py-3">
                    {row.universal_action_id || row.action_id ? (
                      <a
                        href={`/actions?id=${row.universal_action_id || row.action_id}`}
                        className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:underline dark:bg-blue-500/20 dark:text-blue-300"
                        title={`Universal Action ID: ${row.universal_action_id || row.action_id}`}
                      >
                        <span>🎯</span> {row.action_number_snapshot || (String(row.action_id).startsWith('ACT') ? row.action_id : 'Universal Action')}
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--psm-muted)]">Not linked</span>
                    )}
                  </td>
                  <td className="px-3 py-3">{row.capa_id ?? 'Not linked'}</td>
                  <td className="px-3 py-3">{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : 'Not updated'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-[var(--psm-muted)]">No compliance gaps returned by backend.</p>
      )}
    </RegulatoryCard>
  );
}
