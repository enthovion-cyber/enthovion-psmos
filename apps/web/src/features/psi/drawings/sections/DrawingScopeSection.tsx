import { PsiCard } from '../../shared/PsiUi';
import { Field, TextInput, type SectionProps } from './DrawingSectionFields';

export function DrawingScopeSection({ value, onChange }: SectionProps) {
  return (
    <PsiCard title="3. Scope / Unit / Area" subtitle="Company/site/unit safe scope, battery limits, affected systems, and cross-unit context.">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Company"><TextInput value={value.company_id} onChange={(company_id) => onChange({ company_id })} /></Field>
        <Field label="Site"><TextInput value={value.site_id} onChange={(site_id) => onChange({ site_id })} /></Field>
        <Field label="Department"><TextInput value={value.department_id} onChange={(department_id) => onChange({ department_id })} /></Field>
        <Field label="Building/location"><TextInput value={value.building_location} onChange={(building_location) => onChange({ building_location })} /></Field>
        <Field label="Battery limits"><TextInput value={value.battery_limits} onChange={(battery_limits) => onChange({ battery_limits })} /></Field>
        <Field label="Related process step"><TextInput value={value.related_process_step} onChange={(related_process_step) => onChange({ related_process_step })} /></Field>
        <Field label="Related operating mode"><TextInput value={value.related_operating_mode} onChange={(related_operating_mode) => onChange({ related_operating_mode })} /></Field>
        <Field label="Related utilities"><TextInput value={value.related_utilities_text} onChange={(related_utilities_text) => onChange({ related_utilities_text, related_utilities_json: related_utilities_text.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Comma-separated utilities" /></Field>
        <Field label="Upstream unit"><TextInput value={value.upstream_unit_id} onChange={(upstream_unit_id) => onChange({ upstream_unit_id })} /></Field>
        <Field label="Downstream unit"><TextInput value={value.downstream_unit_id} onChange={(downstream_unit_id) => onChange({ downstream_unit_id })} /></Field>
        <Field label="Scope notes"><TextInput value={value.scope_notes} onChange={(scope_notes) => onChange({ scope_notes })} /></Field>
      </div>
    </PsiCard>
  );
}
