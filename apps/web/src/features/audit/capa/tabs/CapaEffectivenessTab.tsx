"use client";
import type { AuditCapaDetail } from "../../types/audit-capa.types";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";
import { AuditCapaEffectivenessStatusBadge } from "../../shared/AuditCapaEffectivenessStatusBadge";

export function CapaEffectivenessTab({ detail }: { detail: AuditCapaDetail }) {
  return (
    <AuditCard title="Effectiveness checks" subtitle="Effectiveness is required for safety-critical, regulatory-critical, repeat-finding, and configured CAPA categories.">
      {detail.effectiveness.length ? <div className="grid gap-3 lg:grid-cols-2">{detail.effectiveness.map((row) => <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><AuditCapaEffectivenessStatusBadge value={row.effectiveness_status} /><p className="mt-3 font-semibold">{row.effectiveness_method ?? "Effectiveness method missing"}</p><p className="mt-1 text-sm text-[var(--psm-muted)]">{row.effectiveness_result_summary ?? row.effectiveness_criteria ?? "No effectiveness result recorded."}</p><p className="mt-3 text-xs text-[var(--psm-muted)]">Due: {row.effectiveness_due_date ?? "-"} | Completed: {row.completed_at ?? "Pending"}</p></div>)}</div> : <AuditEmptyState title="No effectiveness checks" message="No backend effectiveness records are linked to this CAPA yet." />}
    </AuditCard>
  );
}
