import { Field, inputClass } from "../../shared/AuditUi";
import type { AuditStandardMappingContext } from "../../types/audit-standard-mapping.types";
export function MappingApplicabilityScopeSection({ context, defaults = {} }: { context?: AuditStandardMappingContext; defaults?: Record<string, any> }) {
  return <div className="grid gap-3 md:grid-cols-3">
    <Field label="Site"><select name="siteId" defaultValue={defaults.site_id ?? ""} className={inputClass()}><option value="">Company-wide</option>{context?.sites?.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
    <Field label="Unit"><select name="unitId" defaultValue={defaults.unit_id ?? ""} className={inputClass()}><option value="">Any unit</option>{context?.units?.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
    <Field label="Area"><select name="areaId" defaultValue={defaults.area_id ?? ""} className={inputClass()}><option value="">Any area</option>{context?.areas?.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
    <Field label="Equipment ID"><input name="equipmentId" defaultValue={defaults.equipment_id ?? ""} className={inputClass()} /></Field>
    <Field label="Applicability statement"><input name="applicabilityStatement" defaultValue={defaults.applicability_statement ?? ""} className={inputClass()} /></Field>
    <Field label="Applicability justification"><input name="applicabilityJustification" defaultValue={defaults.applicability_justification ?? ""} className={inputClass()} /></Field>
    <Field label="Exclusions"><textarea name="exclusions" defaultValue={defaults.exclusions ?? ""} className={inputClass()} /></Field>
  </div>;
}
