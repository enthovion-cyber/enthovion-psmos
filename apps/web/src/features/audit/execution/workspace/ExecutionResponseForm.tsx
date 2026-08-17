"use client";
import { useState } from "react";
import { AuditButton, Field, formatAuditError, inputClass } from "../../shared/AuditUi";
import { useAuditExecutionResponses } from "../../hooks/useAuditExecutionResponses";
import type { AuditExecutionItem, AuditExecutionResponse } from "../../types/audit-execution.types";

export function ExecutionResponseForm({ executionId, item, response }: { executionId: string; item: AuditExecutionItem; response?: AuditExecutionResponse | undefined }) {
  const mutations = useAuditExecutionResponses();
  const [form, setForm] = useState({ responseStatus: response?.response_status ?? "Answered", complianceResult: response?.compliance_result ?? "", responseText: response?.response_text ?? "", comment: response?.comment ?? "", naJustification: response?.na_justification ?? "" });
  const disabledReason = !form.responseStatus ? "Response status is required." : !form.complianceResult ? "Compliance result is required." : form.complianceResult === "Not Applicable" && !form.naJustification ? "N/A justification is required." : ["Non-Compliant", "Partially Compliant"].includes(form.complianceResult) && !form.comment ? "Comment is required for non-compliance." : "";
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => !disabledReason && mutations.save.mutate({ executionId, itemId: item.id, payload: form });
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <Field label="Response status"><select className={inputClass()} value={form.responseStatus} onChange={(event) => set("responseStatus", event.target.value)}><option>Answered</option><option>Needs Evidence</option><option>Needs Comment</option><option>Needs Review</option></select></Field>
      <Field label="Compliance result"><select className={inputClass()} value={form.complianceResult} onChange={(event) => set("complianceResult", event.target.value)}><option value="">Select result</option><option>Compliant</option><option>Non-Compliant</option><option>Partially Compliant</option><option>Not Applicable</option><option>Not Verified</option><option>Observation</option></select></Field>
      <Field label="Response text"><textarea className={inputClass()} value={form.responseText} onChange={(event) => set("responseText", event.target.value)} /></Field>
      <Field label="Comment"><textarea className={inputClass()} value={form.comment} onChange={(event) => set("comment", event.target.value)} /></Field>
      <Field label="N/A justification"><input className={inputClass()} value={form.naJustification} onChange={(event) => set("naJustification", event.target.value)} /></Field>
      <div className="flex items-end"><AuditButton onClick={save} disabled={Boolean(disabledReason) || mutations.save.isPending} title={disabledReason || "Save response"}>{mutations.save.isPending ? "Saving..." : "Save Response"}</AuditButton></div>
      {mutations.save.error ? <p className="md:col-span-2 text-sm text-danger">{formatAuditError(mutations.save.error)}</p> : null}
    </div>
  );
}
