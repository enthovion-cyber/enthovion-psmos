import Link from "next/link";
import { AuditCard, AuditMetricCard } from "../../shared/AuditUi";
import { AuditEvidenceStatusBadge } from "../../shared/AuditEvidenceStatusBadge";
import { AuditExecutionStatusBadge } from "../../shared/AuditExecutionStatusBadge";
import type { AuditExecutionDetail } from "../../types/audit-execution.types";

export function ExecutionOverviewTab({ detail }: { detail: AuditExecutionDetail }) {
  const readiness = detail.readiness;
  const majorNcCount = readiness?.major_nc_blockers_count ?? detail.execution.major_nc_blockers_count ?? 0;
  const isWaiverActive = Boolean(
    detail.execution.major_nc_waiver_approved_by && detail.execution.major_nc_waiver_reason,
  );

  return (
    <div className="space-y-5">
      {/* Metrics Row */}
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <AuditMetricCard label="Progress" value={`${detail.execution.progress_percent ?? 0}%`} tone="info" />
        <AuditMetricCard label="Total items" value={detail.items.length} />
        <AuditMetricCard
          label="Responses"
          value={detail.responses.length}
          tone={detail.responses.length ? "good" : "neutral"}
        />
        <AuditMetricCard
          label="Evidence links"
          value={detail.evidence.length}
          tone={detail.execution.evidence_missing_count ? "danger" : "good"}
        />
        <AuditMetricCard
          label="Field findings"
          value={detail.findings.length}
          tone={detail.execution.critical_findings_count ? "danger" : "warn"}
        />
        <AuditMetricCard
          label="Major NC Gate"
          value={isWaiverActive ? "Waiver Active" : majorNcCount > 0 ? `${majorNcCount} Blocked` : "Passed"}
          tone={isWaiverActive ? "warn" : majorNcCount > 0 ? "danger" : "good"}
        />
      </div>

      {/* Hard Closure Gate Panel */}
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--psm-line)] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{majorNcCount > 0 && !isWaiverActive ? "🛑" : "🛡️"}</span>
            <div>
              <h3 className="text-base font-bold text-[var(--psm-fg)]">
                Hard Closure Gate &amp; Major NC Assurance
              </h3>
              <p className="text-xs text-[var(--psm-muted)]">
                Enforces OSHA 1910.119 / CCPS rule: No audit finalization while Major Non-Conformances lack verified containment and active CAPAs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isWaiverActive ? (
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Waiver Authorized
              </span>
            ) : majorNcCount > 0 ? (
              <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-400">
                Closure Blocked ({majorNcCount})
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Gate Passed (0 Blockers)
              </span>
            )}
          </div>
        </div>

        {readiness?.major_nc_blockers?.length ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Major Non-Conformance Blockers Requiring Immediate Action:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {readiness.major_nc_blockers.map((b) => (
                <div
                  key={b.id}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-800 dark:text-rose-200">{b.code} - {b.title}</span>
                    <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                      {b.severity || "Critical"}
                    </span>
                  </div>
                  <p className="text-rose-700 dark:text-rose-400">{b.issue}</p>
                  <div className="flex items-center gap-2 pt-1 border-t border-rose-500/20">
                    {b.missingContainment ? (
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                        ⚠️ Containment Unverified
                      </span>
                    ) : null}
                    {b.missingCapa ? (
                      <Link
                        href={`/audit-compliance/capa/create-from-finding?findingId=${b.id}`}
                        className="text-[11px] font-bold text-primary hover:underline ml-auto"
                      >
                        Create CAPA Plan →
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isWaiverActive ? (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-200">
            <span className="font-bold">Active Executive Waiver:</span> Approved by {detail.execution.major_nc_waiver_approved_by} on{" "}
            {detail.execution.major_nc_waiver_granted_at ? new Date(detail.execution.major_nc_waiver_granted_at).toLocaleDateString() : "Active"}. Reason: &ldquo;{detail.execution.major_nc_waiver_reason}&rdquo;
          </div>
        ) : (
          <div className="mt-4 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <span>✓</span> All Major Non-Conformances have verified containment and active CAPAs. Ready for completion.
          </div>
        )}
      </div>

      {/* Snapshot and Readiness Details */}
      <div className="grid gap-5 xl:grid-cols-2">
        <AuditCard title="Execution Snapshot">
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <Fact label="Status" value={<AuditExecutionStatusBadge status={detail.execution.execution_status} />} />
            <Fact label="Mode" value={detail.execution.execution_mode} />
            <Fact label="Audit type" value={detail.execution.audit_type ?? "Not set"} />
            <Fact label="Criticality" value={detail.execution.criticality ?? "Not set"} />
            <Fact label="Evidence" value={<AuditEvidenceStatusBadge status={detail.execution.evidence_status} />} />
            <Fact
              label="Ready for finding register"
              value={detail.execution.ready_for_finding_register ? "Yes" : "No"}
            />
          </div>
        </AuditCard>

        <AuditCard title="Completion Readiness Checklist">
          {readiness?.missing_items_json?.length ? (
            <ul className="space-y-2 text-sm text-danger">
              {readiness.missing_items_json.map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--psm-muted)]">No completion blockers identified.</p>
          )}
          {readiness?.warnings_json?.length ? (
            <ul className="mt-3 space-y-2 text-sm text-amber-700 dark:text-amber-400">
              {readiness.warnings_json.map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span>⚠️</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </AuditCard>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-muted)]">{label}</p>
      <div className="mt-2 font-semibold text-[var(--psm-fg)]">{value}</div>
    </div>
  );
}
