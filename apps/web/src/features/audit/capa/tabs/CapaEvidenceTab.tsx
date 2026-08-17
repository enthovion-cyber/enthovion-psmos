"use client";
import type { AuditCapaDetail } from "../../types/audit-capa.types";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";

export function CapaEvidenceTab({ detail }: { detail: AuditCapaDetail }) {
  return (
    <AuditCard title="Evidence links" subtitle="Evidence metadata links CAPA actions to Document Control/storage records without storing file content in CAPA tables.">
      {detail.evidence.length ? <SimpleTable rows={detail.evidence} columns={["evidence_title","evidence_type","capa_action_id","document_control_id","storage_object_path","evidence_status","added_by","added_at"]} /> : <AuditEmptyState title="No evidence linked" message="No backend evidence links are available for this CAPA." />}
    </AuditCard>
  );
}

function SimpleTable({ rows, columns }: { rows: Record<string, any>[]; columns: string[] }) {
  return <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead className="text-xs uppercase tracking-[.14em] text-[var(--psm-muted)]"><tr>{columns.map((col) => <th key={col} className="border-b border-[var(--psm-line)] p-3">{col}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-[var(--psm-line)]">{columns.map((col) => <td key={col} className="p-3">{String(row[col] ?? "-")}</td>)}</tr>)}</tbody></table></div>;
}
