"use client";
import type { AuditCapaRow } from "../types/audit-capa.types";
import { AuditButton } from "../shared/AuditUi";
import { AuditCapaActionStatusBadge } from "../shared/AuditCapaActionStatusBadge";
import { AuditCapaActionTypeBadge } from "../shared/AuditCapaActionTypeBadge";
import { AuditCapaPriorityBadge } from "../shared/AuditCapaPriorityBadge";

export function AuditCapaActionTable({
  rows,
  onLifecycle,
}: {
  rows: AuditCapaRow[];
  onLifecycle?: ((actionId: string, lifecycle: string, payload?: Record<string, unknown> | undefined) => void) | undefined;
}) {
  return rows.length ? (
    <div className="overflow-x-auto">
      <table className="min-w-[1200px] w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[.14em] text-[var(--psm-muted)]">
          <tr>
            {[
              "Action",
              "Action Center (Universal)",
              "Type",
              "Status",
              "Owner",
              "Verifier",
              "Due",
              "Priority",
              "Evidence",
              "Verification",
              "Effectiveness",
              "Linked Module",
              "Actions",
            ].map((h) => (
              <th key={h} className="border-b border-[var(--psm-line)] p-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[var(--psm-line)] align-top hover:bg-[var(--psm-surface-2)]/40 transition">
              <td className="p-3 font-semibold text-[var(--psm-fg)]">
                <div>{row.action_title}</div>
                {row.action_code ? (
                  <span className="text-[11px] font-mono text-[var(--psm-muted)]">{row.action_code}</span>
                ) : null}
              </td>
              <td className="p-3">
                {row.action_engine_id ? (
                  <a
                    href={`/actions?id=${row.action_engine_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition shadow-sm"
                    title={`Universal Action Engine ID: ${row.action_engine_id}`}
                  >
                    <span>🎯</span>
                    <span className="font-mono">{row.action_number_snapshot || "ACTION CENTER"}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    <span>⚡</span> Foundation Synced
                  </span>
                )}
              </td>
              <td className="p-3">
                <AuditCapaActionTypeBadge value={row.action_type} />
              </td>
              <td className="p-3">
                <AuditCapaActionStatusBadge value={row.action_status} />
              </td>
              <td className="p-3 text-xs font-mono">{row.owner_user_id ?? "Missing"}</td>
              <td className="p-3 text-xs font-mono">{row.verifier_user_id ?? "-"}</td>
              <td className="p-3 whitespace-nowrap">{row.due_date ?? "-"}</td>
              <td className="p-3">
                <AuditCapaPriorityBadge value={row.priority} />
              </td>
              <td className="p-3 text-xs">{row.evidence_required ? "Required" : "Not required"}</td>
              <td className="p-3 text-xs">{row.verification_required ? "Required" : "Not required"}</td>
              <td className="p-3 text-xs">{row.effectiveness_required ? "Required" : "Not required"}</td>
              <td className="p-3 text-xs">{row.linked_module ?? "-"}</td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1.5">
                  <AuditButton
                    variant="secondary"
                    onClick={() =>
                      onLifecycle?.(row.id, "complete", {
                        completionSummary: window.prompt("Completion summary") ?? "",
                      })
                    }
                  >
                    Complete
                  </AuditButton>
                  <AuditButton
                    variant="secondary"
                    onClick={() =>
                      onLifecycle?.(row.id, "verify", {
                        verificationComment: window.prompt("Verification comment") ?? "",
                      })
                    }
                  >
                    Verify
                  </AuditButton>
                  <AuditButton
                    variant="secondary"
                    onClick={() =>
                      onLifecycle?.(row.id, "reject", {
                        reason: window.prompt("Reject reason") ?? "",
                      })
                    }
                  >
                    Reject
                  </AuditButton>
                  <AuditButton
                    variant="secondary"
                    onClick={() =>
                      onLifecycle?.(row.id, "reopen", {
                        reason: window.prompt("Reopen reason") ?? "",
                      })
                    }
                  >
                    Reopen
                  </AuditButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="text-sm text-[var(--psm-muted)]">No backend CAPA actions are linked yet.</p>
  );
}
