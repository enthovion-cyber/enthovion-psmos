import { Field, inputClass } from "../../shared/AuditUi";
export function MappingFindingCapaSection({ defaults = {} }: { defaults?: Record<string, any> }) {
  return <div className="grid gap-3 md:grid-cols-2">
    <Field label="Finding ID"><input name="findingId" defaultValue={defaults.finding_id ?? ""} className={inputClass()} /></Field>
    <Field label="CAPA ID"><input name="capaId" defaultValue={defaults.capa_id ?? ""} className={inputClass()} /></Field>
  </div>;
}
