import type { AuditFindingDetail } from "../types/audit-finding.types";
import { AuditCard, AuditEmptyState } from "../shared/AuditUi";
import { AuditFindingEvidenceStatusBadge } from "../shared/AuditFindingEvidenceStatusBadge";

export function AuditFindingEvidencePanel({ detail }: { detail: AuditFindingDetail }) {
  return (
    <AuditCard title="Evidence link/upload foundation" subtitle="Evidence metadata, Document Control IDs, Storage IDs, execution evidence links, confidentiality, and restricted status.">
      {detail.evidence.length ? <div className="grid gap-3 md:grid-cols-2">{detail.evidence.map((row) => <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-[var(--psm-fg)]">{row.evidence_title}</h3><AuditFindingEvidenceStatusBadge value={row.evidence_status} /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{row.evidence_description ?? "No description."}</p><dl className="mt-3 grid gap-1 text-sm text-[var(--psm-muted)]"><div>Type: {row.evidence_type}</div><div>Document: {row.document_id ?? "-"}</div><div>Storage: {row.storage_file_id ?? "-"}</div><div>Confidentiality: {row.confidentiality_level ?? "Normal"}</div></dl></div>)}</div> : <AuditEmptyState title="No evidence linked" message="Add a Document Control, Storage, execution evidence, photo, screenshot, or module evidence link through the finding form/API." />}
    </AuditCard>
  );
}
