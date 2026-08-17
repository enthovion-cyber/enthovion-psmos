"use client";
import Link from "next/link";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState, Field, inputClass } from "../shared/AuditUi";
import { AuditEvidenceConfidentialityBadge, AuditEvidenceCriticalityBadge, AuditEvidenceReadinessBadge, AuditEvidenceReviewBadge, AuditEvidenceStatusBadge } from "../shared/AuditEvidenceBadges";
import { useAuditEvidenceDetail } from "../hooks/useAuditEvidence";
import { useAuditEvidenceMutations } from "../hooks/useAuditEvidenceMutations";
import { useState } from "react";

const tabs = ["overview", "source", "links", "review", "chain-of-custody", "access", "history"] as const;

export function AuditEvidenceDetailPage({ evidenceId, tab = "overview" }: { evidenceId: string; tab?: string }) {
  const query = useAuditEvidenceDetail(evidenceId);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const detail = query.data;
  const ev = detail.evidence;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title={`${ev.evidence_code ?? "Evidence"} - ${ev.evidence_title ?? "Untitled"}`} subtitle="Controlled source, review, custody, access, and immutable history for audit evidence." actionHref="/audit-compliance/evidence/register" />
    <AuditCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2"><AuditEvidenceStatusBadge value={ev.evidence_status} /><AuditEvidenceReviewBadge value={ev.review_status} /><AuditEvidenceReadinessBadge value={ev.readiness_status} /><AuditEvidenceCriticalityBadge value={ev.criticality} /><AuditEvidenceConfidentialityBadge value={ev.confidentiality_level} /></div>
        <div className="flex flex-wrap gap-2"><AuditButton href={`/audit-compliance/evidence/${evidenceId}/edit`} variant="secondary" disabled={["Verified", "Archived", "Removed", "Superseded"].includes(ev.evidence_status ?? "")} title="Controlled read-only evidence requires replacement/reopen reason.">Edit</AuditButton><AuditButton href="/audit-compliance/evidence/register" variant="secondary">Register</AuditButton></div>
      </div>
      <nav className="mt-4 flex gap-2 overflow-x-auto">{tabs.map((key) => <Link key={key} href={`/audit-compliance/evidence/${evidenceId}/${key === "overview" ? "" : key}`.replace(/\/$/, "")} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold ${tab === key ? "border-primary bg-primary/10 text-primary" : "border-[var(--psm-line)] text-[var(--psm-muted)]"}`}>{label(key)}</Link>)}</nav>
    </AuditCard>
    {tab === "source" ? <SourcePanel detail={detail} /> : tab === "links" ? <LinksPanel detail={detail} /> : tab === "review" ? <ReviewPanel detail={detail} /> : tab === "chain-of-custody" ? <SimpleRows title="Chain of Custody" rows={detail.custody} columns={["event_type", "event_title", "actor_user_id", "created_at", "reason"]} /> : tab === "access" ? <SimpleRows title="Access Events" rows={detail.access} columns={["access_type", "access_status", "accessed_by", "accessed_at", "denied_reason"]} /> : tab === "history" ? <SimpleRows title="Evidence History" rows={detail.history} columns={["event_type", "event_title", "actor_user_id", "created_at", "reason"]} /> : <OverviewPanel detail={detail} />}
  </div></AuditLayout>;
}

function label(tab: string) { return tab.split("-").map((x) => `${x.charAt(0).toUpperCase()}${x.slice(1)}`).join(" "); }

function OverviewPanel({ detail }: { detail: Record<string, any> }) {
  const ev = detail.evidence;
  return <div className="grid gap-5 xl:grid-cols-3">
    <AuditCard title="Evidence overview"><dl className="grid gap-3 text-sm"><Meta label="Type" value={ev.evidence_type} /><Meta label="Source mode" value={ev.source_mode} /><Meta label="Artifact" value={ev.document_id ?? ev.storage_file_id ?? ev.linked_record_id ?? ev.external_reference ?? "Missing"} /><Meta label="Related standard" value={ev.related_standard} /><Meta label="Related clause" value={ev.related_clause} /><Meta label="Owner" value={ev.evidence_owner_user_id} /><Meta label="Reviewer" value={ev.reviewer_user_id} /></dl></AuditCard>
    <AuditCard title="Readiness blockers">{(detail.calculated?.missing ?? []).length ? <ul className="list-disc space-y-2 pl-5 text-sm text-danger">{detail.calculated.missing.map((m: string) => <li key={m}>{m}</li>)}</ul> : <AuditEmptyState title="No calculated blockers" message="Backend readiness calculation returned no missing evidence blockers." />}</AuditCard>
    <AuditCard title="Access and retention"><dl className="grid gap-3 text-sm"><Meta label="Retention" value={ev.retention_requirement} /><Meta label="Expires / stale" value={ev.expires_at ? new Date(ev.expires_at).toLocaleDateString() : "Not set"} /><Meta label="Redaction required" value={ev.redaction_required ? "Yes" : "No"} /><Meta label="Created" value={ev.created_at ? new Date(ev.created_at).toLocaleString() : "-"} /><Meta label="Updated" value={ev.updated_at ? new Date(ev.updated_at).toLocaleString() : "-"} /></dl></AuditCard>
  </div>;
}

function SourcePanel({ detail }: { detail: Record<string, any> }) {
  const ev = detail.evidence;
  return <div className="grid gap-5 xl:grid-cols-2">
    <AuditCard title="Primary source / artifact"><dl className="grid gap-3 text-sm"><Meta label="Document Control ID" value={ev.document_id} /><Meta label="Storage file ID" value={ev.storage_file_id} /><Meta label="Linked module" value={ev.linked_module} /><Meta label="Linked record ID" value={ev.linked_record_id} /><Meta label="Linked record title" value={ev.linked_record_title} /><Meta label="External reference" value={ev.external_reference} /></dl></AuditCard>
    <AuditCard title="Text evidence note"><p className="whitespace-pre-wrap text-sm text-[var(--psm-muted)]">{ev.text_evidence_note || "No text evidence note was captured."}</p></AuditCard>
  </div>;
}

function LinksPanel({ detail }: { detail: Record<string, any> }) {
  const mutations = useAuditEvidenceMutations();
  const [form, setForm] = useState({ linkedModule: "", linkedRecordId: "", linkReason: "" });
  const submit = () => mutations.addLink.mutate({ id: detail.evidence.id, payload: form });
  return <div className="space-y-5">
    <AuditCard title="Add module/document link"><div className="grid gap-3 md:grid-cols-3"><Field label="Linked module"><input className={inputClass()} value={form.linkedModule} onChange={(e) => setForm({ ...form, linkedModule: e.target.value })} /></Field><Field label="Linked record ID"><input className={inputClass()} value={form.linkedRecordId} onChange={(e) => setForm({ ...form, linkedRecordId: e.target.value })} /></Field><Field label="Reason"><input className={inputClass()} value={form.linkReason} onChange={(e) => setForm({ ...form, linkReason: e.target.value })} /></Field></div><div className="mt-4"><AuditButton onClick={submit} disabled={!form.linkedModule || !form.linkedRecordId || mutations.addLink.isPending} title={!form.linkedModule || !form.linkedRecordId ? "Linked module and record ID are required." : "Add controlled evidence link."}>{mutations.addLink.isPending ? "Linking..." : "Add Link"}</AuditButton></div></AuditCard>
    <SimpleRows title="Evidence Links" rows={detail.links} columns={["linked_module", "linked_record_id", "linked_object_type", "primary_link", "linked_by", "linked_at", "remove_reason"]} />
  </div>;
}

function ReviewPanel({ detail }: { detail: Record<string, any> }) {
  const mutations = useAuditEvidenceMutations();
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState("Document Review");
  const review = (action: "verify" | "reject" | "request-rework") => mutations.review.mutate({ id: detail.evidence.id, action, payload: { reason, reviewComment: reason, verificationMethod: method } });
  return <div className="space-y-5"><AuditCard title="Review / verification decision" subtitle="Every decision is backend-controlled and creates audit plus evidence history events."><div className="grid gap-3 md:grid-cols-2"><Field label="Verification method"><input className={inputClass()} value={method} onChange={(e) => setMethod(e.target.value)} /></Field><Field label="Reason / comment"><input className={inputClass()} value={reason} onChange={(e) => setReason(e.target.value)} /></Field></div><div className="mt-4 flex flex-wrap gap-2"><AuditButton onClick={() => review("verify")} disabled={mutations.review.isPending} title="Verify evidence.">Verify</AuditButton><AuditButton variant="danger" onClick={() => review("reject")} disabled={!reason || mutations.review.isPending} title={!reason ? "Reject requires reason." : "Reject evidence."}>Reject</AuditButton><AuditButton variant="secondary" onClick={() => review("request-rework")} disabled={!reason || mutations.review.isPending} title={!reason ? "Request rework requires reason." : "Request rework."}>Request Rework</AuditButton></div></AuditCard><SimpleRows title="Review Records" rows={detail.reviews} columns={["review_decision", "review_status", "verification_method", "reviewed_by", "reviewed_at", "review_comment"]} /></div>;
}

function SimpleRows({ title, rows, columns }: { title: string; rows: Record<string, any>[]; columns: string[] }) {
  return <AuditCard title={title}>{rows.length ? <div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead className="border-b border-[var(--psm-line)] text-xs uppercase text-[var(--psm-muted)]"><tr>{columns.map((c) => <th className="px-3 py-3" key={c}>{c.replaceAll("_", " ")}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={row.id ?? i} className="border-b border-[var(--psm-line)]">{columns.map((c) => <td className="px-3 py-3" key={c}>{format(row[c])}</td>)}</tr>)}</tbody></table></div> : <AuditEmptyState title={`No ${title.toLowerCase()}`} message="The backend returned no rows for this panel." />}</AuditCard>;
}

function Meta({ label, value }: { label: string; value: any }) { return <div className="flex justify-between gap-3 border-b border-[var(--psm-line)] pb-2"><dt className="text-[var(--psm-muted)]">{label}</dt><dd className="text-right font-semibold">{format(value)}</dd></div>; }
function format(value: any) { if (value === null || value === undefined || value === "") return "-"; if (typeof value === "boolean") return value ? "Yes" : "No"; if (typeof value === "object") return JSON.stringify(value); return String(value); }
