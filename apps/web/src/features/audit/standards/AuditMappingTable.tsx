import Link from "next/link";
import { AuditEmptyState } from "../shared/AuditUi";
import { AuditCoverageStatusBadge } from "../components/shared/AuditCoverageStatusBadge";
import { AuditMappingHealthBadge } from "../components/shared/AuditMappingHealthBadge";
import { AuditMappingStatusBadge } from "../components/shared/AuditMappingStatusBadge";
import { AuditMappingStaleBadge } from "../components/shared/AuditMappingStaleBadge";
import type { AuditStandardMapping } from "../types/audit-standard-mapping.types";

export function AuditMappingTable({ rows }: { rows: AuditStandardMapping[] }) {
  if (!rows.length) return <AuditEmptyState title="No standards mappings" message="Create or import mappings from audit programs, plans, checklists, execution responses, evidence, findings, CAPA, scores, or site/module records." />;
  return <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)]"><table className="min-w-full divide-y divide-[var(--psm-line)] text-sm"><thead className="bg-[var(--psm-surface-2)]"><tr>{["Mapping", "Source", "Status", "Coverage", "Evidence", "Finding/CAPA", "Score", "Health", "Stale"].map((head) => <th key={head} className="px-3 py-2 text-left font-semibold text-[var(--psm-muted)]">{head}</th>)}</tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{rows.map((row) => <tr key={row.id}>
    <td className="px-3 py-2"><Link className="font-semibold text-primary hover:underline" href={`/audit-compliance/standards-mapping/${row.id}`}>{row.mapping_code}</Link><div className="text-[var(--psm-muted)]">{row.mapping_title}</div></td>
    <td className="px-3 py-2">{row.source_module ?? row.source_object_type ?? "—"}<div className="text-xs text-[var(--psm-muted)]">{row.source_record_id ?? "No source"}</div></td>
    <td className="px-3 py-2"><AuditMappingStatusBadge value={row.mapping_status} /></td>
    <td className="px-3 py-2"><AuditCoverageStatusBadge value={row.coverage_status} /></td>
    <td className="px-3 py-2">{row.evidence_mapping_status}</td>
    <td className="px-3 py-2">{row.finding_mapping_status}<div className="text-xs text-[var(--psm-muted)]">{row.capa_mapping_status}</div></td>
    <td className="px-3 py-2">{row.score_mapping_status}</td>
    <td className="px-3 py-2"><AuditMappingHealthBadge value={row.mapping_health_status} /></td>
    <td className="px-3 py-2"><AuditMappingStaleBadge value={row.stale_status} /></td>
  </tr>)}</tbody></table></div>;
}
