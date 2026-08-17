import { Field, inputClass } from "../../shared/AuditUi";
export function MappingEvidenceSection({ defaults = {} }: { defaults?: Record<string, any> }) {
  return <div className="grid gap-3 md:grid-cols-3">
    <Field label="Evidence ID"><input name="evidenceId" defaultValue={defaults.evidence_id ?? ""} className={inputClass()} /></Field>
    <Field label="Evidence status"><input readOnly value={defaults.evidence_mapping_status ?? "Backend generated after save"} className={inputClass()} /></Field>
    <Field label="Ready for review"><select name="readyForReview" defaultValue={defaults.ready_for_review ? "true" : "false"} className={inputClass()}><option value="false">No</option><option value="true">Yes</option></select></Field>
  </div>;
}
