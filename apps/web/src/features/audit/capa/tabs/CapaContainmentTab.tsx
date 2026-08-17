"use client";
import type { AuditCapaDetail } from "../../types/audit-capa.types";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";

export function CapaContainmentTab({ detail }: { detail: AuditCapaDetail }) {
  return (
    <AuditCard title="Immediate containment / interim controls" subtitle="Containment records track owner, due date, stop-work recommendation, evidence, verification, and temporary control readiness.">
      {detail.containment.length ? <RecordGrid rows={detail.containment} fields={["containment_required","containment_status","containment_description","containment_owner_user_id","containment_due_date","stop_work_recommendation","evidence_required","verified_at"]} /> : <AuditEmptyState title="No containment records" message="No containment records are linked to this CAPA yet." />}
    </AuditCard>
  );
}

function RecordGrid({ rows, fields }: { rows: Record<string, any>[]; fields: string[] }) {
  return <div className="grid gap-3 lg:grid-cols-2">{rows.map((row) => <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">{fields.map((field) => <div key={field} className="flex justify-between gap-3 py-1 text-sm"><span className="text-[var(--psm-muted)]">{field}</span><span className="text-right text-[var(--psm-fg)]">{String(row[field] ?? "-")}</span></div>)}</div>)}</div>;
}
