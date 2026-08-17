import { Field, inputClass } from "../../shared/AuditUi";
export function MappingScoringSection({ defaults = {} }: { defaults?: Record<string, any> }) {
  return <div className="grid gap-3 md:grid-cols-2">
    <Field label="Score run ID"><input name="scoreRunId" defaultValue={defaults.score_run_id ?? ""} className={inputClass()} /></Field>
    <Field label="Score mapping status"><input readOnly value={defaults.score_mapping_status ?? "Backend generated after save"} className={inputClass()} /></Field>
  </div>;
}
