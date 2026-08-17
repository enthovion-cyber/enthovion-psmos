"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuditButton, AuditCard, Field, inputClass } from "../shared/AuditUi";
import { validateAuditStandardForm } from "../schemas/audit-standard.schema";
import { useAuditStandardMutations } from "../hooks/useAuditStandards";

export function AuditStandardForm({ defaults = {}, id }: { defaults?: Record<string, any>; id?: string }) {
  const router = useRouter();
  const save = useAuditStandardMutations();
  const [errors, setErrors] = useState<string[]>([]);
  async function submit(formData: FormData) {
    const values = Object.fromEntries(Array.from(formData as unknown as Iterable<[string, FormDataEntryValue]>));
    const nextErrors = validateAuditStandardForm(values);
    setErrors(nextErrors);
    if (nextErrors.length) return;
    const saved = await save.mutateAsync({ ...(id ? { id } : {}), payload: values });
    router.push(`/audit-compliance/standards-mapping/standards/${saved.standard?.id ?? saved.id}`);
  }
  return <form action={submit} className="space-y-4"><AuditCard title="Standard Metadata" subtitle="No default legal text is generated; this saves real company/site standards.">
    {errors.length ? <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{errors.join(" ")}</div> : null}
    <div className="grid gap-3 md:grid-cols-3"><Field label="Standard code"><input name="standardCode" defaultValue={defaults.standard_code ?? ""} className={inputClass()} required /></Field><Field label="Standard name"><input name="standardName" defaultValue={defaults.standard_name ?? ""} className={inputClass()} required /></Field><Field label="Standard type"><input name="standardType" defaultValue={defaults.standard_type ?? "Company Standard"} className={inputClass()} /></Field><Field label="Jurisdiction"><input name="jurisdiction" defaultValue={defaults.jurisdiction ?? ""} className={inputClass()} /></Field><Field label="Issuing body"><input name="issuingBody" defaultValue={defaults.issuing_body ?? ""} className={inputClass()} /></Field><Field label="Version"><input name="version" defaultValue={defaults.version ?? ""} className={inputClass()} /></Field><Field label="Effective date"><input type="date" name="effectiveDate" defaultValue={defaults.effective_date ?? ""} className={inputClass()} /></Field><Field label="Status"><select name="standardStatus" defaultValue={defaults.standard_status ?? "Draft"} className={inputClass()}><option>Draft</option><option>Active</option><option>Pending Review</option><option>Verified</option><option>Superseded</option><option>Archived</option></select></Field><Field label="Owner user ID"><input name="ownerUserId" defaultValue={defaults.owner_user_id ?? ""} className={inputClass()} /></Field><Field label="Applicability"><textarea name="applicability" defaultValue={defaults.applicability ?? ""} className={inputClass()} /></Field><Field label="Notes"><textarea name="notes" defaultValue={defaults.notes ?? ""} className={inputClass()} /></Field><Field label="Regulatory register ID"><input name="regulatoryRegisterId" defaultValue={defaults.regulatory_register_id ?? ""} className={inputClass()} /></Field></div>
  </AuditCard><div className="flex justify-end gap-2"><AuditButton href="/audit-compliance/standards-mapping/standards" variant="secondary">Cancel</AuditButton><AuditButton type="submit" disabled={save.isPending} title={save.isPending ? "Saving standard" : "Save standard"}>{save.isPending ? "Saving..." : "Save Standard"}</AuditButton></div></form>;
}
