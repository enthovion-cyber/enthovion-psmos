"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditButton, AuditErrorState, AuditLoadingState, Field, inputClass } from "../shared/AuditUi";
import { useAuditEvidenceContext, useAuditEvidenceDetail } from "../hooks/useAuditEvidence";
import { useAuditEvidenceMutations } from "../hooks/useAuditEvidenceMutations";
import { validateAuditEvidence } from "../schemas/audit-evidence.schema";

export function AuditEvidenceFormPage({ evidenceId }: { evidenceId?: string }) {
  const router = useRouter();
  const context = useAuditEvidenceContext();
  const detail = useAuditEvidenceDetail(evidenceId ?? "");
  const mutations = useAuditEvidenceMutations();
  const existing = detail.data?.evidence;
  const [form, setForm] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const value = useMemo(() => ({
    evidenceTitle: existing?.evidence_title ?? "",
    evidenceDescription: existing?.evidence_description ?? "",
    evidenceType: existing?.evidence_type ?? "Text Evidence Note",
    confidentialityLevel: existing?.confidentiality_level ?? "Internal",
    criticality: existing?.criticality ?? "Medium",
    sourceMode: existing?.source_mode ?? "Text evidence note",
    siteId: existing?.site_id ?? "",
    unitId: existing?.unit_id ?? "",
    areaId: existing?.area_id ?? "",
    evidenceOwnerUserId: existing?.evidence_owner_user_id ?? "",
    reviewerUserId: existing?.reviewer_user_id ?? "",
    linkedModule: existing?.linked_module ?? "",
    linkedRecordId: existing?.linked_record_id ?? "",
    linkedRecordTitle: existing?.linked_record_title ?? "",
    documentId: existing?.document_id ?? "",
    storageFileId: existing?.storage_file_id ?? "",
    textEvidenceNote: existing?.text_evidence_note ?? "",
    externalReference: existing?.external_reference ?? "",
    relatedStandard: existing?.related_standard ?? "",
    relatedClause: existing?.related_clause ?? "",
    evidenceDate: existing?.evidence_date ?? "",
    expiresAt: existing?.expires_at?.slice(0, 10) ?? "",
    ...form,
  }), [existing, form]);
  const set = (key: string, next: any) => setForm((prev) => ({ ...prev, [key]: next }));
  const submit = async () => {
    const validation = validateAuditEvidence(value);
    if (validation) { setError(validation); return; }
    try {
      setError("");
      const result = evidenceId ? await mutations.update.mutateAsync({ id: evidenceId, payload: value }) : await mutations.create.mutateAsync(value);
      router.push(`/audit-compliance/evidence/${result.evidence.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save audit evidence.");
    }
  };
  if (context.isLoading || (evidenceId && detail.isLoading)) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (context.error || (evidenceId && detail.error)) return <AuditLayout><AuditErrorState message={context.error ?? detail.error} /></AuditLayout>;
  const lookups = context.data?.lookups ?? {};
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title={evidenceId ? "Edit Audit Evidence" : "Collect Audit Evidence"} subtitle="Create controlled evidence metadata, source links, classification, review routing, and retention foundation." actionHref="/audit-compliance/evidence/register" />
    <AuditCard title="Evidence identity and classification" subtitle="Required fields are validated in the frontend and again by backend permissions and tenant/site rules.">
      {error ? <p className="mb-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Evidence title *"><input className={inputClass()} value={value.evidenceTitle} onChange={(e) => set("evidenceTitle", e.target.value)} /></Field>
        <Field label="Evidence type *"><Select value={value.evidenceType} onChange={(v) => set("evidenceType", v)} options={lookups.evidenceTypes as string[] | undefined} /></Field>
        <Field label="Source mode *"><Select value={value.sourceMode} onChange={(v) => set("sourceMode", v)} options={lookups.evidenceSourceModes as string[] | undefined} /></Field>
        <Field label="Confidentiality *"><Select value={value.confidentialityLevel} onChange={(v) => set("confidentialityLevel", v)} options={lookups.evidenceConfidentialityLevels as string[] | undefined} /></Field>
        <Field label="Criticality"><Select value={value.criticality} onChange={(v) => set("criticality", v)} options={lookups.criticalityLevels as string[] | undefined} /></Field>
        <Field label="Site"><select className={inputClass()} value={value.siteId} onChange={(e) => set("siteId", e.target.value)}><option value="">Company-level / no site</option>{(context.data?.sites ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Unit"><select className={inputClass()} value={value.unitId} onChange={(e) => set("unitId", e.target.value)}><option value="">No unit</option>{(context.data?.units ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
        <Field label="Area"><select className={inputClass()} value={value.areaId} onChange={(e) => set("areaId", e.target.value)}><option value="">No area</option>{(context.data?.areas ?? []).map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
        <Field label="Evidence owner"><UserSelect value={value.evidenceOwnerUserId} onChange={(v) => set("evidenceOwnerUserId", v)} users={context.data?.users ?? []} /></Field>
        <Field label="Reviewer"><UserSelect value={value.reviewerUserId} onChange={(v) => set("reviewerUserId", v)} users={context.data?.users ?? []} /></Field>
        <Field label="Evidence date"><input type="date" className={inputClass()} value={value.evidenceDate} onChange={(e) => set("evidenceDate", e.target.value)} /></Field>
        <Field label="Expiry / stale date"><input type="date" className={inputClass()} value={value.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} /></Field>
      </div>
    </AuditCard>
    <AuditCard title="Evidence source / artifact foundation" subtitle="File content stays in the existing storage service or Document Control. This form stores controlled metadata and secure references only.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Document Control ID"><input className={inputClass()} value={value.documentId} onChange={(e) => set("documentId", e.target.value)} placeholder="Controlled document ID / number" /></Field>
        <Field label="Storage file ID"><input className={inputClass()} value={value.storageFileId} onChange={(e) => set("storageFileId", e.target.value)} placeholder="Secure storage file reference" /></Field>
        <Field label="Linked module"><input className={inputClass()} value={value.linkedModule} onChange={(e) => set("linkedModule", e.target.value)} placeholder="PTW, MOC, PSSR, Audit Finding..." /></Field>
        <Field label="Linked record ID"><input className={inputClass()} value={value.linkedRecordId} onChange={(e) => set("linkedRecordId", e.target.value)} /></Field>
        <Field label="Linked record title"><input className={inputClass()} value={value.linkedRecordTitle} onChange={(e) => set("linkedRecordTitle", e.target.value)} /></Field>
        <Field label="External reference"><input className={inputClass()} value={value.externalReference} onChange={(e) => set("externalReference", e.target.value)} /></Field>
        <Field label="Related standard"><input className={inputClass()} value={value.relatedStandard} onChange={(e) => set("relatedStandard", e.target.value)} /></Field>
        <Field label="Related clause"><input className={inputClass()} value={value.relatedClause} onChange={(e) => set("relatedClause", e.target.value)} /></Field>
        <Field label="Evidence description"><textarea className={inputClass()} value={value.evidenceDescription} onChange={(e) => set("evidenceDescription", e.target.value)} rows={4} /></Field>
        <Field label="Text evidence note"><textarea className={inputClass()} value={value.textEvidenceNote} onChange={(e) => set("textEvidenceNote", e.target.value)} rows={4} /></Field>
      </div>
      <div className="mt-5 flex flex-wrap gap-2"><AuditButton onClick={submit} disabled={mutations.create.isPending || mutations.update.isPending} title="Save evidence through backend API with audit/history hooks.">{mutations.create.isPending || mutations.update.isPending ? "Saving..." : "Save Evidence"}</AuditButton><AuditButton href="/audit-compliance/evidence/register" variant="secondary">Cancel</AuditButton></div>
    </AuditCard>
  </div></AuditLayout>;
}

function Select({ value, options = [], onChange }: { value: string; options?: string[] | undefined; onChange: (value: string) => void }) {
  return <select className={inputClass()} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select>;
}

function UserSelect({ value, users, onChange }: { value: string; users: Record<string, any>[]; onChange: (value: string) => void }) {
  return <select className={inputClass()} value={value} onChange={(e) => onChange(e.target.value)}><option value="">Unassigned</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name ?? u.email} - {u.email}</option>)}</select>;
}
