import { PsiCard } from '../../shared/PsiUi';
import { Field, SelectInput, TextInput, ToggleInput, type SectionProps } from './DrawingSectionFields';

export function DrawingMocRedlineSection({ value, lookups, onChange }: SectionProps) {
  return (
    <PsiCard title="6. MOC / Redline / As-Built Status" subtitle="Redline, MOC update, drawing update completion, as-built verification, field walkdown, and startup blocker status.">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Redline exists"><div className="pt-3"><ToggleInput checked={Boolean(value.redline_exists)} onChange={(redline_exists) => onChange({ redline_exists })} /></div></Field>
        <Field label="Redline status"><SelectInput value={value.redline_status} options={lookups?.redlineStatuses ?? []} onChange={(redline_status) => onChange({ redline_status })} /></Field>
        <Field label="Redline document link"><TextInput value={value.redline_document_id} onChange={(redline_document_id) => onChange({ redline_document_id })} /></Field>
        <Field label="Redline owner"><TextInput value={value.redline_owner_id} onChange={(redline_owner_id) => onChange({ redline_owner_id })} /></Field>
        <Field label="Redline due date"><TextInput type="date" value={value.redline_due_date} onChange={(redline_due_date) => onChange({ redline_due_date })} /></Field>
        <Field label="MOC required"><div className="pt-3"><ToggleInput checked={Boolean(value.moc_required)} onChange={(moc_required) => onChange({ moc_required })} /></div></Field>
        <Field label="Linked MOC"><TextInput value={value.linked_moc_id} onChange={(linked_moc_id) => onChange({ linked_moc_id })} /></Field>
        <Field label="MOC update status"><SelectInput value={value.moc_update_status} options={lookups?.mocDrawingUpdateStatuses ?? []} onChange={(moc_update_status) => onChange({ moc_update_status })} /></Field>
        <Field label="Drawing update required by MOC"><div className="pt-3"><ToggleInput checked={Boolean(value.drawing_update_required_by_moc)} onChange={(drawing_update_required_by_moc) => onChange({ drawing_update_required_by_moc })} /></div></Field>
        <Field label="Drawing update completed"><div className="pt-3"><ToggleInput checked={Boolean(value.drawing_update_completed)} onChange={(drawing_update_completed) => onChange({ drawing_update_completed })} /></div></Field>
        <Field label="As-built required"><div className="pt-3"><ToggleInput checked={Boolean(value.as_built_required)} onChange={(as_built_required) => onChange({ as_built_required })} /></div></Field>
        <Field label="As-built verified"><div className="pt-3"><ToggleInput checked={Boolean(value.as_built_verified)} onChange={(as_built_verified) => onChange({ as_built_verified })} /></div></Field>
        <Field label="Field walkdown required"><div className="pt-3"><ToggleInput checked={Boolean(value.field_walkdown_required)} onChange={(field_walkdown_required) => onChange({ field_walkdown_required })} /></div></Field>
        <Field label="Field walkdown status"><TextInput value={value.field_walkdown_status} onChange={(field_walkdown_status) => onChange({ field_walkdown_status })} /></Field>
        <Field label="Field walkdown evidence"><TextInput value={value.field_walkdown_evidence_document_id} onChange={(field_walkdown_evidence_document_id) => onChange({ field_walkdown_evidence_document_id })} /></Field>
        <Field label="Comments"><TextInput value={value.comments} onChange={(comments) => onChange({ comments })} /></Field>
      </div>
    </PsiCard>
  );
}
