"use client";
import { useState } from "react";
import { AuditButton } from "../shared/AuditUi";
import { AuditEvidenceStatusBadge } from "../shared/AuditEvidenceStatusBadge";
import { AuditExecutionProgressBadge } from "../shared/AuditExecutionProgressBadge";
import { AuditExecutionStatusBadge } from "../shared/AuditExecutionStatusBadge";
import type { AuditExecutionRow, AuditExecutionReadiness } from "../types/audit-execution.types";

export function AuditExecutionDetailHeader({
  execution,
  readiness,
  onAction,
  busy,
}: {
  execution: AuditExecutionRow;
  readiness?: AuditExecutionReadiness | null;
  onAction?: (action: string, payload?: Record<string, unknown>) => void;
  busy?: boolean;
}) {
  const [showGateModal, setShowGateModal] = useState(false);
  const [waiverApprovedBy, setWaiverApprovedBy] = useState("");
  const [waiverReason, setWaiverReason] = useState("");

  const majorBlockersCount =
    readiness?.major_nc_blockers_count ?? execution.major_nc_blockers_count ?? 0;
  const isWaiverActive = Boolean(
    execution.major_nc_waiver_approved_by && execution.major_nc_waiver_reason,
  );
  const isClosureBlocked = majorBlockersCount > 0 && !isWaiverActive;

  const handleCompleteClick = () => {
    if (isClosureBlocked) {
      setShowGateModal(true);
    } else {
      onAction?.("complete", {});
    }
  };

  const handleApplyWaiverAndComplete = () => {
    if (!waiverApprovedBy.trim() || !waiverReason.trim()) {
      alert("Executive waiver requires both an authorized approver and a justification reason.");
      return;
    }
    onAction?.("complete", {
      allowMajorNcWaiver: true,
      waiverApprovedBy: waiverApprovedBy.trim(),
      waiverReason: waiverReason.trim(),
    });
    setShowGateModal(false);
  };

  return (
    <>
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Audit Execution</p>
              {isWaiverActive ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  🛡️ Executive Closure Waiver Active
                </span>
              ) : isClosureBlocked ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                  🚨 Major NC Closure Gate: {majorBlockersCount} Blocker{majorBlockersCount > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-[var(--psm-fg)]">
              {execution.execution_code} - {execution.execution_title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <AuditExecutionStatusBadge status={execution.execution_status} />
              <AuditExecutionProgressBadge value={execution.progress_percent} />
              <AuditEvidenceStatusBadge status={execution.evidence_status} />
              {execution.audit_type ? (
                <span className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs text-[var(--psm-muted)]">
                  {execution.audit_type}
                </span>
              ) : null}
              {execution.criticality ? (
                <span className="rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2 py-0.5 text-xs font-semibold text-[var(--psm-fg)]">
                  Tier: {execution.criticality}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AuditButton href={`/audit-compliance/execution/${execution.id}/workspace`} variant="secondary">
              Workspace
            </AuditButton>
            <AuditButton
              onClick={() => onAction?.("pause")}
              disabled={busy || execution.execution_status !== "In Progress"}
              title={execution.execution_status !== "In Progress" ? "Only in-progress executions can be paused." : "Pause execution"}
              variant="secondary"
            >
              Pause
            </AuditButton>
            <AuditButton
              onClick={() => onAction?.("resume")}
              disabled={busy || execution.execution_status !== "Paused"}
              title={execution.execution_status !== "Paused" ? "Only paused executions can be resumed." : "Resume execution"}
              variant="secondary"
            >
              Resume
            </AuditButton>
            <AuditButton
              onClick={handleCompleteClick}
              disabled={busy || execution.execution_status === "Completed" || execution.execution_status === "Closed"}
              variant={isClosureBlocked ? "secondary" : "primary"}
            >
              {isClosureBlocked ? "⚠️ Complete (Gate Blocked)" : "Complete"}
            </AuditButton>
          </div>
        </div>

        {/* Hard Closure Gate Alert Banner */}
        {isClosureBlocked ? (
          <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🛑</span>
                <div>
                  <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                    Hard Closure Gate Blocked ({majorBlockersCount} Open Major Non-Conformance{majorBlockersCount > 1 ? "s" : ""})
                  </h4>
                  <p className="text-xs text-rose-700/90 dark:text-rose-300/90 mt-0.5">
                    OSHA 1910.119 / PSM assurance standards prohibit audit finalization while Major Non-Conformances lack verified immediate containment or an assigned CAPA plan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGateModal(true)}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
              >
                Review Gate & Blocker Details
              </button>
            </div>
          </div>
        ) : isWaiverActive ? (
          <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-200">
            <span className="font-bold">Executive Waiver Active:</span> Approved by{" "}
            <span className="font-semibold underline">{execution.major_nc_waiver_approved_by}</span>. Justification:{" "}
            &ldquo;{execution.major_nc_waiver_reason}&rdquo;
          </div>
        ) : null}
      </header>

      {/* Hard Closure Gate Modal */}
      {showGateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="border-b border-[var(--psm-line)] p-5 flex items-center justify-between bg-rose-500/10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚨</span>
                <div>
                  <h3 className="text-lg font-bold text-rose-800 dark:text-rose-200">
                    Major Non-Conformance Hard Closure Gate
                  </h3>
                  <p className="text-xs text-[var(--psm-muted)]">
                    Audit closure blocked until safety containment &amp; CAPAs are verified
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGateModal(false)}
                className="text-xs font-bold text-[var(--psm-muted)] hover:text-[var(--psm-fg)] p-1 rounded-md"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)] mb-2">
                  Active Major Non-Conformance Blockers ({majorBlockersCount})
                </h4>
                {readiness?.major_nc_blockers?.length ? (
                  <ul className="space-y-2">
                    {readiness.major_nc_blockers.map((blocker) => (
                      <li
                        key={blocker.id}
                        className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between font-semibold text-rose-800 dark:text-rose-300">
                          <span>{blocker.code} - {blocker.title}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-300">
                            {blocker.severity || "Critical"}
                          </span>
                        </div>
                        <p className="text-rose-700 dark:text-rose-400">{blocker.issue}</p>
                      </li>
                    ))}
                  </ul>
                ) : readiness?.missing_items_json?.length ? (
                  <ul className="space-y-1.5 text-xs text-rose-600 dark:text-rose-400">
                    {readiness.missing_items_json.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--psm-muted)]">
                    Major non-conformances identified in execution require immediate verified containment and CAPA assignment.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <span>🛡️</span> Executive Closure Waiver Override
                </h4>
                <p className="text-xs text-[var(--psm-muted)]">
                  Under strict governance rules, an authorized executive (Plant Manager or Process Safety Director) may approve an override waiver if interim controls are active.
                </p>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--psm-fg)] block mb-1">
                      Waiver Approver (Name &amp; Title) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Marcus Vance, VP of Safety &amp; Operations"
                      value={waiverApprovedBy}
                      onChange={(e) => setWaiverApprovedBy(e.target.value)}
                      className="w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2 text-xs text-[var(--psm-fg)] focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--psm-fg)] block mb-1">
                      Engineering Justification &amp; Interim Isolation Reason *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Interim positive physical isolation verified and tagged out under LOTO-0912; CAPA package expedited with corporate turnaround team."
                      value={waiverReason}
                      onChange={(e) => setWaiverReason(e.target.value)}
                      className="w-full rounded-md border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2 text-xs text-[var(--psm-fg)] focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--psm-line)] p-4 flex items-center justify-end gap-2 bg-[var(--psm-surface-2)]">
              <AuditButton variant="secondary" onClick={() => setShowGateModal(false)}>
                Cancel &amp; Resolve Gaps
              </AuditButton>
              <button
                type="button"
                onClick={handleApplyWaiverAndComplete}
                disabled={!waiverApprovedBy.trim() || !waiverReason.trim() || busy}
                className="rounded-md bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold shadow-sm transition"
              >
                Authorize Waiver &amp; Complete Execution
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
