import { PsiCard } from '../../shared/PsiUi';
import { Field, SelectInput, TextInput, type SectionProps } from './DrawingSectionFields';

export function DrawingTagIndexSection({ value, lookups, onChange }: SectionProps) {
  return (
    <PsiCard title="5. Tag Index Foundation" subtitle="Manual and CSV tag index foundation for equipment tags, lines, instruments, valves, PSV/SIF/interlock/alarm tags, analyzers, fire/gas detectors, utilities, drains, and vents.">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Tag number"><TextInput value={value.tag_number} onChange={(tag_number) => onChange({ tag_number })} /></Field>
        <Field label="Tag type"><SelectInput value={value.tag_type} options={lookups?.tagTypes ?? []} onChange={(tag_type) => onChange({ tag_type })} /></Field>
        <Field label="Tag description"><TextInput value={value.tag_description} onChange={(tag_description) => onChange({ tag_description })} /></Field>
        <Field label="Service"><TextInput value={value.tag_service} onChange={(tag_service) => onChange({ tag_service })} /></Field>
        <Field label="Linked module"><TextInput value={value.tag_linked_module} onChange={(tag_linked_module) => onChange({ tag_linked_module })} /></Field>
        <Field label="Linked record ID"><TextInput value={value.tag_linked_record_id} onChange={(tag_linked_record_id) => onChange({ tag_linked_record_id })} /></Field>
        <Field label="Found on sheet/page"><TextInput value={value.sheet_page_reference} onChange={(sheet_page_reference) => onChange({ sheet_page_reference })} /></Field>
        <Field label="Coordinates/page reference"><TextInput value={value.coordinate_reference} onChange={(coordinate_reference) => onChange({ coordinate_reference })} /></Field>
        <Field label="Verification status"><SelectInput value={value.verification_status} options={lookups?.tagVerificationStatuses ?? []} onChange={(verification_status) => onChange({ verification_status })} /></Field>
        <Field label="Source method"><SelectInput value={value.source_method} options={lookups?.tagSourceMethods ?? []} onChange={(source_method) => onChange({ source_method })} /></Field>
        <Field label="Mismatch reason"><TextInput value={value.mismatch_reason} onChange={(mismatch_reason) => onChange({ mismatch_reason })} /></Field>
      </div>
    </PsiCard>
  );
}
