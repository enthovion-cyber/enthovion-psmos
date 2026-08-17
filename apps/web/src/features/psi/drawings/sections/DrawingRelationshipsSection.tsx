import { PsiCard } from '../../shared/PsiUi';
import { Field, SelectInput, TextInput, ToggleInput, type SectionProps } from './DrawingSectionFields';

export function DrawingRelationshipsSection({ value, lookups, onChange }: SectionProps) {
  return (
    <PsiCard title="4. Drawing Relationships" subtitle="Link process units, equipment, lines, instruments, relief devices, SOL, HAZOP, LOPA, MOC, PSSR, PTW/LOTO, SOPs, emergency records, and audit evidence.">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Linked module"><TextInput value={value.relationship_linked_module} onChange={(relationship_linked_module) => onChange({ relationship_linked_module })} placeholder="Equipment, MOC, Relief Systems..." /></Field>
        <Field label="Linked record ID"><TextInput value={value.relationship_linked_record_id} onChange={(relationship_linked_record_id) => onChange({ relationship_linked_record_id })} /></Field>
        <Field label="Linked record label"><TextInput value={value.relationship_linked_record_label} onChange={(relationship_linked_record_label) => onChange({ relationship_linked_record_label })} /></Field>
        <Field label="Relationship type"><SelectInput value={value.relationship_type} options={lookups?.relationshipTypes ?? []} onChange={(relationship_type) => onChange({ relationship_type })} /></Field>
        <Field label="Readiness impact"><div className="pt-3"><ToggleInput checked={Boolean(value.relationship_readiness_impact)} onChange={(relationship_readiness_impact) => onChange({ relationship_readiness_impact })} /></div></Field>
        <Field label="PSSR impact"><div className="pt-3"><ToggleInput checked={Boolean(value.relationship_pssr_impact)} onChange={(relationship_pssr_impact) => onChange({ relationship_pssr_impact })} /></div></Field>
        <Field label="MOC impact"><div className="pt-3"><ToggleInput checked={Boolean(value.relationship_moc_impact)} onChange={(relationship_moc_impact) => onChange({ relationship_moc_impact })} /></div></Field>
      </div>
    </PsiCard>
  );
}
