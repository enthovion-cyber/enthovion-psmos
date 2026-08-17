import { Field, inputClass } from "../../shared/AuditUi";
export function MappingModuleSection({ defaults = {} }: { defaults?: Record<string, any> }) {
  return <div className="grid gap-3 md:grid-cols-3">
    <Field label="Module key"><input name="moduleKey" defaultValue={defaults.module_key ?? ""} className={inputClass()} placeholder="PTW, MOC, PSI, MI..." /></Field>
    <Field label="Module record ID"><input name="moduleRecordId" defaultValue={defaults.module_record_id ?? ""} className={inputClass()} /></Field>
    <Field label="Primary mapping"><select name="primaryMapping" defaultValue={defaults.primary_mapping ? "true" : "false"} className={inputClass()}><option value="false">No</option><option value="true">Yes</option></select></Field>
  </div>;
}
