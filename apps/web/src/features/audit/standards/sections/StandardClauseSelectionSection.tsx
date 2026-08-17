import { Field, inputClass } from "../../shared/AuditUi";
import type { AuditStandardMappingContext } from "../../types/audit-standard-mapping.types";

export function StandardClauseSelectionSection({ context, defaults = {} }: { context?: AuditStandardMappingContext; defaults?: Record<string, any> }) {
  return <div className="grid gap-3 md:grid-cols-2">
    <Field label="Standard"><select name="standardId" defaultValue={defaults.standard_id ?? ""} className={inputClass()} required><option value="">Select standard</option>{context?.standards?.map((row) => <option key={row.id} value={row.id}>{row.standard_code} - {row.standard_name}</option>)}</select></Field>
    <Field label="Clause"><input name="clauseId" defaultValue={defaults.clause_id ?? ""} className={inputClass()} placeholder="Paste/select clause ID from clause register" required /></Field>
    <Field label="Mapping title"><input name="mappingTitle" defaultValue={defaults.mapping_title ?? ""} className={inputClass()} required /></Field>
    <Field label="Mapping status"><select name="mappingStatus" defaultValue={defaults.mapping_status ?? "Draft"} className={inputClass()}><option>Draft</option><option>Mapped</option><option>Pending Review</option><option>Verified</option><option>Gap</option><option>Stale</option><option>Not Applicable</option></select></Field>
  </div>;
}
