"use client";
import type { AuditCapaDetail } from "../../types/audit-capa.types";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";

export function CapaHistoryTab({ detail }: { detail: AuditCapaDetail }) {
  return (
    <AuditCard title="CAPA history / audit trail" subtitle="Immutable CAPA history events are written for create, update, status transition, action lifecycle, evidence, verification, effectiveness, sync, and closure readiness changes.">
      {detail.history.length ? <div className="space-y-3">{detail.history.map((row) => <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-[var(--psm-fg)]">{row.event_title ?? row.event_type}</p><span className="text-xs text-[var(--psm-muted)]">{row.created_at}</span></div><p className="mt-1 text-sm text-[var(--psm-muted)]">{row.event_description ?? row.reason ?? "No event description."}</p></div>)}</div> : <AuditEmptyState title="No history events" message="No CAPA history events are visible in your permission scope yet." />}
    </AuditCard>
  );
}
