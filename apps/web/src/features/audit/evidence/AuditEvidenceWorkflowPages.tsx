"use client";
import { useState } from "react";
import type { ReactNode } from "react";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState, Field, inputClass } from "../shared/AuditUi";
import { AuditEvidenceAccessBadge, AuditEvidenceRequirementBadge, AuditEvidenceRequestBadge } from "../shared/AuditEvidenceBadges";
import { useAuditEvidenceContext } from "../hooks/useAuditEvidence";
import { useAuditEvidenceAccessLog } from "../hooks/useAuditEvidenceAccessLog";
import { useAuditEvidenceGaps } from "../hooks/useAuditEvidenceGaps";
import { useAuditEvidenceMutations } from "../hooks/useAuditEvidenceMutations";
import { useAuditEvidencePackages } from "../hooks/useAuditEvidencePackages";
import { useAuditEvidenceRequests } from "../hooks/useAuditEvidenceRequests";
import { useAuditEvidenceRequirements } from "../hooks/useAuditEvidenceRequirements";
import { validateAuditEvidenceRequirement } from "../schemas/audit-evidence-requirement.schema";
import { validateAuditEvidenceRequest } from "../schemas/audit-evidence-request.schema";

export function AuditEvidenceRequirementPage() {
  const query = useAuditEvidenceRequirements();
  const mutations = useAuditEvidenceMutations();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Evidence Requirements" subtitle="Mandatory and optional evidence requirements generated or maintained by audit scope." actionHref="/audit-compliance/evidence/new" /><RequirementForm /><AuditCard title={`${query.data.total} requirements`}><Rows rows={query.data.rows} columns={["requirement_code", "requirement_title", "source_module", "source_record_id", "criticality", "mandatory", "due_date", "requirement_status"]} renderStatus={(r) => <AuditEvidenceRequirementBadge value={r.requirement_status} />} actions={(r) => <AuditButton variant="secondary" onClick={() => mutations.waiveRequirement.mutate({ id: r.id, reason: "Waived from requirements page with controlled user action." })} disabled={r.waived || mutations.waiveRequirement.isPending} title={r.waived ? "Requirement is already waived." : "Waive requirement with audit/history event."}>Waive</AuditButton>} /></AuditCard></div></AuditLayout>;
}

export function AuditEvidenceRequestPage() {
  const query = useAuditEvidenceRequests();
  const mutations = useAuditEvidenceMutations();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Evidence Requests" subtitle="Request, submit, cancel, and track evidence responses with due dates and review states." actionHref="/audit-compliance/evidence/requests/new" /><RequestForm /><AuditCard title={`${query.data.total} requests`}><Rows rows={query.data.rows} columns={["request_code", "request_title", "source_module", "requested_from_user_id", "due_date", "priority", "request_status"]} renderStatus={(r) => <AuditEvidenceRequestBadge value={r.request_status} />} actions={(r) => <div className="flex flex-wrap gap-2"><AuditButton variant="secondary" onClick={() => mutations.requestTransition.mutate({ id: r.id, action: "send" })} disabled={r.request_status !== "Draft"} title={r.request_status !== "Draft" ? "Only draft requests can be sent." : "Send evidence request."}>Send</AuditButton><AuditButton variant="secondary" onClick={() => mutations.requestTransition.mutate({ id: r.id, action: "cancel", payload: { reason: "Cancelled from evidence request register." } })} disabled={["Cancelled", "Fulfilled"].includes(r.request_status)} title="Cancel request with audit/history event.">Cancel</AuditButton></div>} /></AuditCard></div></AuditLayout>;
}

export function AuditEvidenceGapPage({ preset = {} }: { preset?: Record<string, any> }) {
  const query = useAuditEvidenceGaps(preset);
  const mutations = useAuditEvidenceMutations();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Evidence Gaps" subtitle="Backend-generated missing evidence, stale evidence, restricted evidence, and source readiness gaps." actionHref="/audit-compliance/evidence/requirements" /><AuditCard title="Gap detection" action={<AuditButton onClick={() => mutations.detectGaps.mutate(preset)} disabled={mutations.detectGaps.isPending} title="Create open gaps from mandatory unfulfilled evidence requirements.">{mutations.detectGaps.isPending ? "Detecting..." : "Detect Gaps"}</AuditButton>}><p className="text-sm text-[var(--psm-muted)]">Gap detection is generated from backend evidence requirements and current source scope.</p></AuditCard><AuditCard title={`${query.data.total} gaps`}><Rows rows={query.data.rows} columns={["gap_title", "source_module", "source_record_id", "gap_severity", "criticality", "due_date", "gap_status"]} actions={(r) => <AuditButton variant="secondary" onClick={() => mutations.resolveGap.mutate({ id: r.id, resolutionNote: "Resolved from evidence gap register." })} disabled={r.gap_status === "Resolved"} title={r.gap_status === "Resolved" ? "Gap is already resolved." : "Resolve gap with note."}>Resolve</AuditButton>} /></AuditCard></div></AuditLayout>;
}

export function AuditEvidencePackagePage() {
  const query = useAuditEvidencePackages();
  const mutations = useAuditEvidenceMutations();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Evidence Package Foundation" subtitle="Prepare report-ready package manifests without duplicating final report or Document Control." actionHref="/audit-compliance/evidence/packages" /><PackageForm /><AuditCard title={`${query.data.total} package foundations`}><Rows rows={query.data.rows} columns={["package_code", "package_title", "package_type", "source_module", "package_status", "included_evidence_count", "excluded_evidence_count", "prepared_at"]} actions={(r) => <AuditButton variant="secondary" onClick={() => mutations.prepareManifest.mutate(r.id)} disabled={mutations.prepareManifest.isPending} title="Prepare immutable package manifest foundation.">Prepare Manifest</AuditButton>} /></AuditCard></div></AuditLayout>;
}

export function AuditEvidenceAccessLogPage() {
  const query = useAuditEvidenceAccessLog();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Evidence Access Log" subtitle="Read-only access, preview, download, restriction, and denial metadata." actionHref="/audit-compliance/evidence/register" /><AuditCard title={`${query.data.total} access events`}><Rows rows={query.data.rows} columns={["access_type", "access_status", "evidence_id", "document_id", "storage_file_id", "accessed_by", "accessed_at", "denied_reason"]} renderStatus={(r) => <AuditEvidenceAccessBadge value={r.access_status} />} /></AuditCard></div></AuditLayout>;
}

function RequirementForm() {
  const context = useAuditEvidenceContext();
  const mutations = useAuditEvidenceMutations();
  const [form, setForm] = useState<Record<string, any>>({ mandatory: true, criticality: "Medium", sourceModule: "AUDIT", sourceRecordId: "" });
  const [error, setError] = useState("");
  const save = async () => { const validation = validateAuditEvidenceRequirement(form); if (validation) { setError(validation); return; } setError(""); await mutations.saveRequirement.mutateAsync({ payload: form }); setForm({ mandatory: true, criticality: "Medium", sourceModule: "AUDIT", sourceRecordId: "" }); };
  return <AuditCard title="Create requirement">{error ? <p className="mb-3 text-danger">{error}</p> : null}<div className="grid gap-3 md:grid-cols-3"><Field label="Requirement title *"><input className={inputClass()} value={form.requirementTitle ?? ""} onChange={(e) => setForm({ ...form, requirementTitle: e.target.value })} /></Field><Field label="Source module *"><input className={inputClass()} value={form.sourceModule ?? ""} onChange={(e) => setForm({ ...form, sourceModule: e.target.value })} /></Field><Field label="Source record ID *"><input className={inputClass()} value={form.sourceRecordId ?? ""} onChange={(e) => setForm({ ...form, sourceRecordId: e.target.value })} /></Field><Field label="Site"><select className={inputClass()} value={form.siteId ?? ""} onChange={(e) => setForm({ ...form, siteId: e.target.value })}><option value="">Company-level</option>{(context.data?.sites ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><Field label="Due date"><input type="date" className={inputClass()} value={form.dueDate ?? ""} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field><Field label="Acceptance criteria"><input className={inputClass()} value={form.acceptanceCriteria ?? ""} onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })} /></Field></div><div className="mt-4"><AuditButton onClick={save} disabled={mutations.saveRequirement.isPending} title="Create backend evidence requirement.">Save Requirement</AuditButton></div></AuditCard>;
}

function RequestForm() {
  const context = useAuditEvidenceContext();
  const mutations = useAuditEvidenceMutations();
  const [form, setForm] = useState<Record<string, any>>({ priority: "Medium", criticality: "Medium", sourceModule: "AUDIT", sourceRecordId: "" });
  const [error, setError] = useState("");
  const save = async () => { const validation = validateAuditEvidenceRequest(form); if (validation) { setError(validation); return; } setError(""); await mutations.saveRequest.mutateAsync({ payload: form }); setForm({ priority: "Medium", criticality: "Medium", sourceModule: "AUDIT", sourceRecordId: "" }); };
  return <AuditCard title="Create evidence request">{error ? <p className="mb-3 text-danger">{error}</p> : null}<div className="grid gap-3 md:grid-cols-3"><Field label="Request title *"><input className={inputClass()} value={form.requestTitle ?? ""} onChange={(e) => setForm({ ...form, requestTitle: e.target.value })} /></Field><Field label="Requested from"><select className={inputClass()} value={form.requestedFromUserId ?? ""} onChange={(e) => setForm({ ...form, requestedFromUserId: e.target.value })}><option value="">Unassigned</option>{(context.data?.users ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name ?? u.email}</option>)}</select></Field><Field label="Due date *"><input type="date" className={inputClass()} value={form.dueDate ?? ""} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field><Field label="Source module *"><input className={inputClass()} value={form.sourceModule ?? ""} onChange={(e) => setForm({ ...form, sourceModule: e.target.value })} /></Field><Field label="Source record ID *"><input className={inputClass()} value={form.sourceRecordId ?? ""} onChange={(e) => setForm({ ...form, sourceRecordId: e.target.value })} /></Field><Field label="Description"><input className={inputClass()} value={form.requestDescription ?? ""} onChange={(e) => setForm({ ...form, requestDescription: e.target.value })} /></Field></div><div className="mt-4"><AuditButton onClick={save} disabled={mutations.saveRequest.isPending} title="Create backend evidence request.">Save Request</AuditButton></div></AuditCard>;
}

function PackageForm() {
  const mutations = useAuditEvidenceMutations();
  const [form, setForm] = useState<Record<string, any>>({ sourceModule: "Audit Evidence Collection", sourceRecordId: "general" });
  return <AuditCard title="Create package foundation"><div className="grid gap-3 md:grid-cols-3"><Field label="Package title"><input className={inputClass()} value={form.packageTitle ?? ""} onChange={(e) => setForm({ ...form, packageTitle: e.target.value })} /></Field><Field label="Source module"><input className={inputClass()} value={form.sourceModule ?? ""} onChange={(e) => setForm({ ...form, sourceModule: e.target.value })} /></Field><Field label="Source record ID"><input className={inputClass()} value={form.sourceRecordId ?? ""} onChange={(e) => setForm({ ...form, sourceRecordId: e.target.value })} /></Field></div><div className="mt-4"><AuditButton onClick={() => mutations.savePackage.mutate(form)} disabled={!form.packageTitle || mutations.savePackage.isPending} title={!form.packageTitle ? "Package title is required." : "Create package foundation."}>Save Package</AuditButton></div></AuditCard>;
}

function Rows({ rows, columns, renderStatus, actions }: { rows: Record<string, any>[]; columns: string[]; renderStatus?: (row: Record<string, any>) => ReactNode; actions?: (row: Record<string, any>) => ReactNode }) {
  if (!rows.length) return <AuditEmptyState title="No records returned" message="No backend rows matched this workflow view and permission scope." />;
  return <div className="overflow-x-auto"><table className="min-w-[1100px] w-full text-left text-sm"><thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]"><tr>{columns.map((c) => <th key={c} className="px-3 py-3">{c.replaceAll("_", " ")}</th>)}<th className="px-3 py-3">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-[var(--psm-line)] align-top">{columns.map((c) => <td key={c} className="px-3 py-3">{c.includes("status") && renderStatus ? renderStatus(row) : format(row[c])}</td>)}<td className="px-3 py-3">{actions?.(row) ?? "-"}</td></tr>)}</tbody></table></div>;
}

function format(value: any) { if (value === null || value === undefined || value === "") return "-"; if (typeof value === "boolean") return value ? "Yes" : "No"; if (typeof value === "object") return JSON.stringify(value); return String(value); }
