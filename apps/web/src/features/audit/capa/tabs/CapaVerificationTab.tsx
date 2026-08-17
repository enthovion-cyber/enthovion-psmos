"use client";
import type { AuditCapaDetail } from "../../types/audit-capa.types";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";
import { AuditCapaVerificationStatusBadge } from "../../shared/AuditCapaVerificationStatusBadge";

export function CapaVerificationTab({ detail }: { detail: AuditCapaDetail }) {
  return (
    <AuditCard title="Verification records" subtitle="Verification is backend-controlled and tied to CAPA action lifecycle decisions.">
      {detail.verification.length ? <div className="grid gap-3 lg:grid-cols-2">{detail.verification.map((row) => <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><AuditCapaVerificationStatusBadge value={row.verification_status} /><p className="mt-3 font-semibold">{row.verification_method ?? "Verification method missing"}</p><p className="mt-1 text-sm text-[var(--psm-muted)]">{row.verification_comment ?? row.verification_criteria ?? "No verification comment recorded."}</p><p className="mt-3 text-xs text-[var(--psm-muted)]">Verifier: {row.verifier_user_id ?? "-"} | {row.verified_at ?? "Pending"}</p></div>)}</div> : <AuditEmptyState title="No verification records" message="No verification records are linked to this CAPA yet." />}
    </AuditCard>
  );
}
