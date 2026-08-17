import { RegulatoryAuditCoverageStatusBadge } from '../shared/RegulatoryAuditCoverageStatusBadge';
import { RegulatoryAuditReadinessBadge } from '../shared/RegulatoryAuditReadinessBadge';
import { RegulatoryEmptyState } from '../shared/RegulatoryUi';
import { valueText } from './AuditMappingUi';

export function RegulatoryAuditMappingMatrixTable({ rows }: { rows?: Record<string, any>[] | undefined }) {
  if (!rows?.length) return <RegulatoryEmptyState title="No matrix rows" message="The backend did not return obligation-to-audit matrix rows for this scope." />;
  return <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]"><table className="min-w-full text-left text-sm"><thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-[.14em] text-[var(--psm-muted)]"><tr>{['Obligation', 'Regulatory Item', 'Mappings', 'Verified', 'Coverage', 'Readiness', 'Gaps'].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row, index) => <tr key={row.obligation?.id ?? index}><td className="px-3 py-3 font-semibold">{valueText(row.obligation?.obligation_number ?? row.obligation?.id)}</td><td className="px-3 py-3 text-[var(--psm-muted)]">{valueText(row.regulatoryItem?.requirement_number ?? row.obligation?.regulatory_item_id)}</td><td className="px-3 py-3">{row.mappingCount ?? 0}</td><td className="px-3 py-3">{row.verifiedCount ?? 0}</td><td className="px-3 py-3"><RegulatoryAuditCoverageStatusBadge value={row.coverageStatus} /></td><td className="px-3 py-3"><RegulatoryAuditReadinessBadge value={row.readinessStatus} /></td><td className="px-3 py-3">{row.gapCount ?? 0}</td></tr>)}</tbody></table></div>;
}
