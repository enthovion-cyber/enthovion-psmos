import Link from "next/link";
import { AuditEvidenceConfidentialityBadge, AuditEvidenceCriticalityBadge, AuditEvidenceReadinessBadge, AuditEvidenceReviewBadge, AuditEvidenceStatusBadge } from "../shared/AuditEvidenceBadges";
import { AuditButton, AuditEmptyState } from "../shared/AuditUi";
import type { AuditEvidenceRow } from "../types/audit-evidence.types";

export function AuditEvidenceTable({ rows }: { rows: AuditEvidenceRow[] }) {
  if (!rows.length) return <AuditEmptyState title="No evidence records match" message="No backend evidence records matched the current filter, source scope, and permissions." action={<AuditButton href="/audit-compliance/evidence/new">Collect Evidence</AuditButton>} />;
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-[1600px] w-full text-left text-sm">
          <thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]"><tr>{["Evidence", "Type", "Source", "Status", "Review", "Readiness", "Criticality", "Classification", "Artifact", "Updated", "Actions"].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-b border-[var(--psm-line)] align-top">
            <td className="px-3 py-4"><Link className="font-semibold text-primary" href={`/audit-compliance/evidence/${row.id}`}>{row.evidence_code ?? "No code"}</Link><p>{row.evidence_title ?? "Untitled evidence"}</p></td>
            <td className="px-3 py-4">{row.evidence_type ?? "-"}</td>
            <td className="px-3 py-4">{row.linked_module ?? row.source_mode ?? "-"}<p className="text-xs text-[var(--psm-muted)]">{row.linked_record_id ?? row.document_id ?? row.storage_file_id ?? "No source record"}</p></td>
            <td className="px-3 py-4"><AuditEvidenceStatusBadge value={row.evidence_status} /></td>
            <td className="px-3 py-4"><AuditEvidenceReviewBadge value={row.review_status} /></td>
            <td className="px-3 py-4"><AuditEvidenceReadinessBadge value={row.readiness_status} /></td>
            <td className="px-3 py-4"><AuditEvidenceCriticalityBadge value={row.criticality} /></td>
            <td className="px-3 py-4"><AuditEvidenceConfidentialityBadge value={row.confidentiality_level} /></td>
            <td className="px-3 py-4">{row.document_id ? "Document Control" : row.storage_file_id ? "Storage file" : row.linked_record_id ? "Module record" : row.text_evidence_note ? "Text note" : "Missing"}</td>
            <td className="px-3 py-4">{row.updated_at ? new Date(row.updated_at).toLocaleString() : "-"}</td>
            <td className="px-3 py-4"><div className="flex gap-2"><AuditButton href={`/audit-compliance/evidence/${row.id}`} variant="secondary">View</AuditButton><AuditButton href={`/audit-compliance/evidence/${row.id}/edit`} variant="secondary" disabled={["Verified", "Archived", "Removed", "Superseded"].includes(row.evidence_status ?? "")} title="Verified, archived, removed, and superseded evidence is controlled read-only.">Edit</AuditButton></div></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="grid gap-3 lg:hidden">{rows.map((row) => <Link key={row.id} href={`/audit-compliance/evidence/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
        <div className="flex items-start justify-between gap-3"><div><b>{row.evidence_code ?? "No code"}</b><p>{row.evidence_title ?? "Untitled evidence"}</p></div><AuditEvidenceStatusBadge value={row.evidence_status} /></div>
        <div className="mt-3 flex flex-wrap gap-2"><AuditEvidenceReviewBadge value={row.review_status} /><AuditEvidenceReadinessBadge value={row.readiness_status} /><AuditEvidenceConfidentialityBadge value={row.confidentiality_level} /></div>
      </Link>)}</div>
    </>
  );
}
