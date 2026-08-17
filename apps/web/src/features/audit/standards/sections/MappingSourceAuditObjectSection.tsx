import { Field, inputClass } from "../../shared/AuditUi";
export function MappingSourceAuditObjectSection({ defaults = {} }: { defaults?: Record<string, any> }) {
  return <div className="grid gap-3 md:grid-cols-3">
    <Field label="Source object type"><select name="sourceObjectType" defaultValue={defaults.source_object_type ?? ""} className={inputClass()}><option value="">Select source</option><option value="program">Audit Program</option><option value="plan">Audit Plan</option><option value="checklist">Checklist Template</option><option value="execution">Execution</option><option value="response">Checklist Response</option><option value="evidence">Evidence</option><option value="finding">Finding</option><option value="capa">CAPA</option><option value="score-run">Score Run</option><option value="site">Site</option><option value="unit">Unit</option><option value="area">Area</option><option value="module-record">Module Record</option></select></Field>
    <Field label="Source module"><input name="sourceModule" defaultValue={defaults.source_module ?? ""} className={inputClass()} placeholder="Audit Execution, Evidence, CAPA..." /></Field>
    <Field label="Source record ID"><input name="sourceRecordId" defaultValue={defaults.source_record_id ?? ""} className={inputClass()} /></Field>
    <Field label="Program ID"><input name="programId" defaultValue={defaults.program_id ?? ""} className={inputClass()} /></Field>
    <Field label="Plan ID"><input name="planId" defaultValue={defaults.plan_id ?? ""} className={inputClass()} /></Field>
    <Field label="Execution ID"><input name="executionId" defaultValue={defaults.execution_id ?? ""} className={inputClass()} /></Field>
  </div>;
}
