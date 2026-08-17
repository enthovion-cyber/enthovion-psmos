"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuditButton, AuditCard, Field, inputClass } from "../shared/AuditUi";
import { validateAuditClauseForm } from "../schemas/audit-clause.schema";
import { useAuditClauseMutations } from "../hooks/useAuditClauses";
import { useAuditStandardLookups } from "../hooks/useAuditStandardLookups";

export function AuditClauseForm({ defaults = {}, id }: { defaults?: Record<string, any>; id?: string }) {
  const router = useRouter();
  const save = useAuditClauseMutations();
  const context = useAuditStandardLookups();
  const [errors, setErrors] = useState<string[]>([]);
  async function submit(formData: FormData) {
    const values = Object.fromEntries(Array.from(formData as unknown as Iterable<[string, FormDataEntryValue]>));
    const nextErrors = validateAuditClauseForm(values);
    setErrors(nextErrors);
    if (nextErrors.length) return;
    const saved = await save.mutateAsync({ ...(id ? { id } : {}), payload: values });
    router.push(`/audit-compliance/standards-mapping/clauses/${saved.clause?.id ?? saved.id}`);
  }
  return <form action={submit} className="space-y-4"><AuditCard title="Clause / Obligation" subtitle="Clause-level audit, evidence, module, and criticality expectations.">
    {errors.length ? <div className="mb-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{errors.join(" ")}</div> : null}
    <div className="grid gap-3 md:grid-cols-3"><Field label="Standard"><select name="standardId" defaultValue={defaults.standard_id ?? ""} className={inputClass()} required><option value="">Select standard</option>{context.data?.standards?.map((row) => <option key={row.id} value={row.id}>{row.standard_code} - {row.standard_name}</option>)}</select></Field><Field label="Parent clause ID"><input name="parentClauseId" defaultValue={defaults.parent_clause_id ?? ""} className={inputClass()} /></Field><Field label="Clause code"><input name="clauseCode" defaultValue={defaults.clause_code ?? ""} className={inputClass()} required /></Field><Field label="Clause title"><input name="clauseTitle" defaultValue={defaults.clause_title ?? ""} className={inputClass()} required /></Field><Field label="Requirement category"><input name="requirementCategory" defaultValue={defaults.requirement_category ?? ""} className={inputClass()} /></Field><Field label="Criticality"><select name="criticality" defaultValue={defaults.criticality ?? "Medium"} className={inputClass()}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option><option>Safety-Critical</option><option>Regulatory-Critical</option><option>PSM-Critical</option></select></Field><Field label="Linked module"><input name="linkedModule" defaultValue={defaults.linked_module ?? ""} className={inputClass()} /></Field><Field label="Evidence expectation"><textarea name="evidenceExpectation" defaultValue={defaults.evidence_expectation ?? ""} className={inputClass()} /></Field><Field label="Audit expectation"><textarea name="auditExpectation" defaultValue={defaults.audit_expectation ?? ""} className={inputClass()} /></Field><Field label="Verification method"><input name="verificationMethodFoundation" defaultValue={defaults.verification_method_foundation ?? ""} className={inputClass()} /></Field><Field label="Regulatory obligation ID"><input name="regulatoryObligationId" defaultValue={defaults.regulatory_obligation_id ?? ""} className={inputClass()} /></Field><Field label="Applicability"><textarea name="applicability" defaultValue={defaults.applicability ?? ""} className={inputClass()} /></Field><label className="flex items-center gap-2 text-sm font-semibold"><input name="mandatory" type="checkbox" defaultChecked={defaults.mandatory !== false} /> Mandatory requirement</label></div>
  </AuditCard><div className="flex justify-end gap-2"><AuditButton href="/audit-compliance/standards-mapping/clauses" variant="secondary">Cancel</AuditButton><AuditButton type="submit" disabled={save.isPending} title={save.isPending ? "Saving clause" : "Save clause"}>{save.isPending ? "Saving..." : "Save Clause"}</AuditButton></div></form>;
}
