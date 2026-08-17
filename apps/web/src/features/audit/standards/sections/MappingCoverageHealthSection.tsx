import { Field, inputClass } from "../../shared/AuditUi";
import { AuditMappingHealthBadge } from "../../components/shared/AuditMappingHealthBadge";
export function MappingCoverageHealthSection({ defaults = {} }: { defaults?: Record<string, any> }) {
  return <div className="grid gap-3 md:grid-cols-3">
    <Field label="Coverage"><input readOnly value={defaults.coverage_status ?? "Backend generated"} className={inputClass()} /></Field>
    <Field label="Health"><div className="flex min-h-10 items-center"><AuditMappingHealthBadge value={defaults.mapping_health_status ?? "Backend generated"} /></div></Field>
    <Field label="Manual mapping reason"><input name="manualMappingReason" defaultValue={defaults.manual_mapping_reason ?? ""} className={inputClass()} /></Field>
    <label className="flex items-center gap-2 text-sm font-semibold text-[var(--psm-fg)]"><input name="manualMapping" type="checkbox" defaultChecked={Boolean(defaults.manual_mapping)} /> Manual mapping / override source</label>
  </div>;
}
