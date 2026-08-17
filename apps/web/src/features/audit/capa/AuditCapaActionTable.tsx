"use client";
import type { AuditCapaRow } from "../types/audit-capa.types";
import { AuditButton } from "../shared/AuditUi";
import { AuditCapaActionStatusBadge } from "../shared/AuditCapaActionStatusBadge";
import { AuditCapaActionTypeBadge } from "../shared/AuditCapaActionTypeBadge";
import { AuditCapaPriorityBadge } from "../shared/AuditCapaPriorityBadge";

export function AuditCapaActionTable({ rows, onLifecycle }: { rows: AuditCapaRow[]; onLifecycle?: ((actionId: string, lifecycle: string, payload?: Record<string, unknown> | undefined) => void) | undefined }) {
  return rows.length ? (
    <div className="overflow-x-auto">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[.14em] text-[var(--psm-muted)]"><tr>{["Action","Type","Status","Owner","Verifier","Due","Priority","Evidence","Verification","Effectiveness","Linked Module","Actions"].map((h) => <th key={h} className="border-b border-[var(--psm-line)] p-3">{h}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} className="border-b border-[var(--psm-line)] align-top">
          <td className="p-3 font-semibold text-[var(--psm-fg)]">{row.action_title}</td>
          <td className="p-3"><AuditCapaActionTypeBadge value={row.action_type} /></td>
          <td className="p-3"><AuditCapaActionStatusBadge value={row.action_status} /></td>
          <td className="p-3">{row.owner_user_id ?? "Missing"}</td>
          <td className="p-3">{row.verifier_user_id ?? "-"}</td>
          <td className="p-3">{row.due_date ?? "-"}</td>
          <td className="p-3"><AuditCapaPriorityBadge value={row.priority} /></td>
          <td className="p-3">{row.evidence_required ? "Required" : "Not required"}</td>
          <td className="p-3">{row.verification_required ? "Required" : "Not required"}</td>
          <td className="p-3">{row.effectiveness_required ? "Required" : "Not required"}</td>
          <td className="p-3">{row.linked_module ?? "-"}</td>
          <td className="p-3"><div className="flex flex-wrap gap-2">
            <AuditButton variant="secondary" onClick={() => onLifecycle?.(row.id, "complete", { completionSummary: window.prompt("Completion summary") ?? "" })}>Complete</AuditButton>
            <AuditButton variant="secondary" onClick={() => onLifecycle?.(row.id, "verify", { verificationComment: window.prompt("Verification comment") ?? "" })}>Verify</AuditButton>
            <AuditButton variant="secondary" onClick={() => onLifecycle?.(row.id, "reject", { reason: window.prompt("Reject reason") ?? "" })}>Reject</AuditButton>
            <AuditButton variant="secondary" onClick={() => onLifecycle?.(row.id, "reopen", { reason: window.prompt("Reopen reason") ?? "" })}>Reopen</AuditButton>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
  ) : <p className="text-sm text-[var(--psm-muted)]">No backend CAPA actions are linked yet.</p>;
}
