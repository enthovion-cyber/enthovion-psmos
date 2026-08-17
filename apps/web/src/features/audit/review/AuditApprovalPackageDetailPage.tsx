"use client";
import { useParams } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditBadge, AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { AuditApprovalStatusBadge } from "../shared/AuditApprovalStatusBadge";
import { AuditApprovalConditionStatusBadge } from "../shared/AuditApprovalConditionStatusBadge";
import { AuditDecisionBadge } from "../shared/AuditDecisionBadge";
import { AuditEsignatureStatusBadge } from "../shared/AuditEsignatureStatusBadge";
import { AuditStalePackageBadge } from "../shared/AuditStalePackageBadge";
import { AuditValidationStatusBadge } from "../shared/AuditValidationStatusBadge";
import { useAuditApprovalPackageDetail } from "../hooks/useAuditApprovalPackageDetail";
import { useAuditApprovalMutations } from "../hooks/useAuditApprovalMutations";
import type { AuditApprovalDetail } from "../types/audit-review.types";

export function AuditApprovalPackageDetailPage({ section = "overview" }: { section?: string }) {
  const params = useParams<{ approvalId: string }>();
  const approvalId = params.approvalId;
  const query = useAuditApprovalPackageDetail(approvalId);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const data = query.data;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title={data.approval.package_title} subtitle={`${data.approval.source_module} review package with immutable source snapshot, validation, stale detection, staged decisions, conditions, and e-signature links.`} actionHref="/audit-compliance/review-approval/packages" actionLabel="All Packages" />
    <PackageHeader data={data} />
    {section === "review" ? <AuditApprovalDecisionPanel data={data} /> : null}
    {section === "source" ? <SourcePanel data={data} /> : null}
    {section === "snapshot" ? <JsonPanel title="Immutable Source Snapshot" data={data.snapshot} /> : null}
    {section === "evidence" ? <RowsPanel title="Evidence Links" rows={data.evidence} empty="No evidence links are included in this package." /> : null}
    {section === "validation" ? <ValidationPanel data={data} /> : null}
    {section === "stages" ? <RowsPanel title="Approval Stages" rows={data.stages} empty="No stages are configured yet." /> : null}
    {section === "decisions" ? <DecisionsPanel data={data} /> : null}
    {section === "e-signatures" ? <EsignaturePanel data={data} /> : null}
    {section === "conditions" ? <ConditionsPanel data={data} /> : null}
    {section === "history" ? <RowsPanel title="Approval History" rows={data.history} empty="No history events are recorded yet." /> : null}
    {section === "overview" ? <OverviewPanels data={data} /> : null}
  </div></AuditLayout>;
}

function PackageHeader({ data }: { data: AuditApprovalDetail }) {
  return <AuditCard title="Approval Package Header" subtitle="Current backend state and readiness.">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <div><p className="text-xs text-[var(--psm-muted)]">Package status</p><AuditApprovalStatusBadge status={data.approval.package_status} /></div>
      <div><p className="text-xs text-[var(--psm-muted)]">Validation</p><AuditValidationStatusBadge status={data.approval.validation_status} /></div>
      <div><p className="text-xs text-[var(--psm-muted)]">Stale status</p><AuditStalePackageBadge status={data.approval.stale_status} /></div>
      <div><p className="text-xs text-[var(--psm-muted)]">E-signature</p><AuditEsignatureStatusBadge required={data.approval.e_signature_required} /></div>
      <div><p className="text-xs text-[var(--psm-muted)]">Readiness</p><AuditBadge tone={data.readiness.status === "Ready" ? "good" : data.readiness.status === "Blocked" ? "danger" : "warn"}>{data.readiness.status}</AuditBadge></div>
    </div>
    {data.readiness.blockers.length ? <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4"><h3 className="font-semibold text-danger">Approval blockers</h3><ul className="mt-2 space-y-1 text-sm">{data.readiness.blockers.map((blocker) => <li key={`${blocker.title}-${blocker.message}`}>{blocker.title}: {blocker.message}</li>)}</ul></div> : null}
  </AuditCard>;
}

function OverviewPanels({ data }: { data: AuditApprovalDetail }) {
  return <div className="grid gap-5 xl:grid-cols-2">
    <SourcePanel data={data} />
    <ValidationPanel data={data} />
    <AuditApprovalDecisionPanel data={data} />
    <ConditionsPanel data={data} />
    <RowsPanel title="Approval Stages" rows={data.stages} empty="No stages are configured yet." />
    <DecisionsPanel data={data} />
    <EsignaturePanel data={data} />
    <RowsPanel title="Approval History" rows={data.history} empty="No history events are recorded yet." />
  </div>;
}

function AuditApprovalDecisionPanel({ data }: { data: AuditApprovalDetail }) {
  const mutations = useAuditApprovalMutations(data.approval.id);
  const blockedReason = data.readiness.readyForApproval ? "" : data.readiness.blockers.map((item) => item.title).join(", ");
  const decide = (action: string) => mutations.transition.mutate({ action, data: { reason: `${action} from review panel`, conditions: action === "approve-with-conditions" ? [{ conditionTitle: "Complete approval condition", conditionDescription: "Condition entered from review panel." }] : undefined } });
  return <AuditCard title="Approval Decision Panel" subtitle="Frontend requests a backend transition; it never marks approval locally.">
    <div className="flex flex-wrap gap-2">
      <AuditButton onClick={() => decide("run-validation")} variant="secondary" disabled={mutations.transition.isPending} title="Run backend readiness and stale checks">Run Validation</AuditButton>
      <AuditButton onClick={() => decide("approve")} disabled={Boolean(blockedReason) || mutations.transition.isPending} title={blockedReason ? `Approval blocked: ${blockedReason}` : "Approve package"}>Approve</AuditButton>
      <AuditButton onClick={() => decide("approve-with-conditions")} variant="secondary" disabled={Boolean(blockedReason) || mutations.transition.isPending} title={blockedReason ? `Approval blocked: ${blockedReason}` : "Approve with tracked conditions"}>Approve with Conditions</AuditButton>
      <AuditButton onClick={() => decide("return")} variant="secondary" disabled={mutations.transition.isPending} title="Return requires correction instructions; backend enforces reason">Return</AuditButton>
      <AuditButton onClick={() => decide("reject")} variant="danger" disabled={mutations.transition.isPending} title="Reject requires reason; backend enforces it">Reject</AuditButton>
      <AuditButton onClick={() => decide("refresh-snapshot")} variant="secondary" disabled={mutations.transition.isPending} title="Refresh immutable snapshot from current source">Refresh Snapshot</AuditButton>
    </div>
    {mutations.transition.error ? <p className="mt-3 text-sm text-danger">{String((mutations.transition.error as Error).message)}</p> : null}
  </AuditCard>;
}

function SourcePanel({ data }: { data: AuditApprovalDetail }) {
  return <AuditCard title="Source Package Snapshot" subtitle="Source access, immutable hash, stale state, and report readiness foundation.">
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      {Object.entries(data.source).map(([key, value]) => <div key={key} className="rounded-lg bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase text-[var(--psm-muted)]">{key}</dt><dd className="mt-1 break-words font-semibold">{String(value ?? "Not set")}</dd></div>)}
    </dl>
  </AuditCard>;
}

function ValidationPanel({ data }: { data: AuditApprovalDetail }) {
  return <AuditCard title="Validation Before Approval" subtitle="Backend generated readiness and stale checks.">
    {data.validationChecks.length ? <div className="space-y-2">{data.validationChecks.map((row, index) => <div key={String(row.id ?? index)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><span className="font-semibold">{String(row.validation_type ?? row.check_name ?? "Validation check")}</span><AuditValidationStatusBadge status={String(row.validation_status ?? row.check_result ?? "Not Run")} /></div>)}</div> : <AuditEmptyState title="No validation results" message="Run validation to store backend checks on the package." />}
  </AuditCard>;
}

function DecisionsPanel({ data }: { data: AuditApprovalDetail }) {
  return <AuditCard title="Decision Traceability" subtitle="Every decision is recorded with actor, time, reason, and source snapshot hash.">
    {data.decisions.length ? <div className="space-y-3">{data.decisions.map((row, index) => <div key={String(row.id ?? index)} className="rounded-lg border border-[var(--psm-line)] p-3"><AuditDecisionBadge decision={String(row.decision ?? "")} /><p className="mt-2 text-sm">{String(row.reason ?? row.correction_instructions ?? "No reason recorded")}</p><p className="mt-1 text-xs text-[var(--psm-muted)]">{String(row.decided_at ?? "")}</p></div>)}</div> : <AuditEmptyState title="No decisions" message="Approvals, returns, rejections, requests for information, and e-sign links will appear here." />}
  </AuditCard>;
}

function EsignaturePanel({ data }: { data: AuditApprovalDetail }) {
  return <AuditCard title="E-Signature Links" subtitle="Audit stores Universal E-Signature references only; signatures are never faked here.">
    {data.esignatures.length ? <Rows rows={data.esignatures} /> : <AuditEmptyState title="No e-signature links" message="Safety-critical or regulatory-critical approvals will require an existing e-signature reference." />}
  </AuditCard>;
}

function ConditionsPanel({ data }: { data: AuditApprovalDetail }) {
  return <AuditCard title="Approval Conditions" subtitle="Conditions remain visible and block readiness while open if marked blocking.">
    {data.conditions.length ? <div className="space-y-3">{data.conditions.map((row, index) => <div key={String(row.id ?? index)} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex flex-wrap justify-between gap-2"><b>{String(row.condition_title ?? "Condition")}</b><AuditApprovalConditionStatusBadge status={String(row.condition_status ?? "Open")} /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{String(row.condition_description ?? "No description")}</p></div>)}</div> : <AuditEmptyState title="No conditions" message="Approve with conditions creates condition records that can be completed and verified." />}
  </AuditCard>;
}

function RowsPanel({ title, rows, empty }: { title: string; rows: Record<string, unknown>[]; empty: string }) {
  return <AuditCard title={title}>{rows.length ? <Rows rows={rows} /> : <AuditEmptyState title={title} message={empty} />}</AuditCard>;
}

function Rows({ rows }: { rows: Record<string, unknown>[] }) {
  return <div className="space-y-2">{rows.map((row, index) => <pre key={String(row.id ?? index)} className="max-h-56 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-muted)]">{JSON.stringify(row, null, 2)}</pre>)}</div>;
}

function JsonPanel({ title, data }: { title: string; data: Record<string, unknown> }) {
  return <AuditCard title={title}><pre className="max-h-[620px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-muted)]">{JSON.stringify(data, null, 2)}</pre></AuditCard>;
}
