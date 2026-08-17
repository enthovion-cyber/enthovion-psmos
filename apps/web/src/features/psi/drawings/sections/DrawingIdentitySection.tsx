import { PsiCard } from '../../shared/PsiUi';
import { Field, SelectInput, TextInput, ToggleInput, type SectionProps } from './DrawingSectionFields';

export function DrawingIdentitySection({ value, lookups, forcedUnitId, onChange }: SectionProps) {
  return (
    <PsiCard title="1. Drawing Identity" subtitle="Drawing number, title, type, discipline, package, owners, criticality, and review schedule.">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Drawing number"><TextInput value={value.drawing_number} onChange={(drawing_number) => onChange({ drawing_number })} /></Field>
        <Field label="Drawing title"><TextInput value={value.drawing_title} onChange={(drawing_title) => onChange({ drawing_title })} /></Field>
        <Field label="Drawing type"><SelectInput value={value.drawing_type} options={lookups?.drawingTypes ?? []} onChange={(drawing_type) => onChange({ drawing_type })} /></Field>
        <Field label="Discipline"><SelectInput value={value.discipline} options={lookups?.drawingDisciplines ?? []} onChange={(discipline) => onChange({ discipline })} /></Field>
        <Field label="Process unit"><TextInput value={forcedUnitId ?? value.unit_id} onChange={(unit_id) => onChange({ unit_id })} placeholder="Unit ID" /></Field>
        <Field label="Area"><TextInput value={value.area_id} onChange={(area_id) => onChange({ area_id })} /></Field>
        <Field label="System/service"><TextInput value={value.system_service} onChange={(system_service) => onChange({ system_service })} /></Field>
        <Field label="Drawing package"><TextInput value={value.drawing_package} onChange={(drawing_package) => onChange({ drawing_package })} /></Field>
        <Field label="Sheet number"><TextInput value={value.sheet_number} onChange={(sheet_number) => onChange({ sheet_number })} /></Field>
        <Field label="Total sheets"><TextInput type="number" value={value.total_sheets} onChange={(total_sheets) => onChange({ total_sheets })} /></Field>
        <Field label="Drawing scale"><TextInput value={value.drawing_scale} onChange={(drawing_scale) => onChange({ drawing_scale })} /></Field>
        <Field label="Status"><SelectInput value={value.status} options={lookups?.drawingStatuses ?? []} onChange={(status) => onChange({ status })} /></Field>
        <Field label="Owner"><TextInput value={value.owner_user_id} onChange={(owner_user_id) => onChange({ owner_user_id })} placeholder="IAM user ID" /></Field>
        <Field label="Document controller"><TextInput value={value.document_controller_id} onChange={(document_controller_id) => onChange({ document_controller_id })} /></Field>
        <Field label="Process engineer"><TextInput value={value.process_engineer_id} onChange={(process_engineer_id) => onChange({ process_engineer_id })} /></Field>
        <Field label="Discipline engineer"><TextInput value={value.discipline_engineer_id} onChange={(discipline_engineer_id) => onChange({ discipline_engineer_id })} /></Field>
        <Field label="Operations owner"><TextInput value={value.operations_owner_id} onChange={(operations_owner_id) => onChange({ operations_owner_id })} /></Field>
        <Field label="HSE/process safety reviewer"><TextInput value={value.hse_reviewer_id} onChange={(hse_reviewer_id) => onChange({ hse_reviewer_id })} /></Field>
        <Field label="Last review date"><TextInput type="date" value={value.last_review_date} onChange={(last_review_date) => onChange({ last_review_date })} /></Field>
        <Field label="Next review due"><TextInput type="date" value={value.next_review_due} onChange={(next_review_due) => onChange({ next_review_due })} /></Field>
        <Field label="Critical drawing"><div className="pt-3"><ToggleInput checked={Boolean(value.critical_drawing)} onChange={(critical_drawing) => onChange({ critical_drawing })} /></div></Field>
        <Field label="PSM-critical"><div className="pt-3"><ToggleInput checked={Boolean(value.psm_critical)} onChange={(psm_critical) => onChange({ psm_critical })} /></div></Field>
        <Field label="Notes"><TextInput value={value.notes} onChange={(notes) => onChange({ notes })} /></Field>
      </div>
    </PsiCard>
  );
}
