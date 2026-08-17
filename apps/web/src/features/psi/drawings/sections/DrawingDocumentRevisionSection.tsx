import { PsiCard } from '../../shared/PsiUi';
import { Field, SelectInput, TextInput, ToggleInput, type SectionProps } from './DrawingSectionFields';

export function DrawingDocumentRevisionSection({ value, lookups, onChange }: SectionProps) {
  return (
    <PsiCard title="2. Document Link / Revision" subtitle="Document Control remains source of truth for files, versions, approvals, status, and download permissions.">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Linked Document Control document"><TextInput value={value.document_id} onChange={(document_id) => onChange({ document_id })} /></Field>
        <Field label="Document version"><TextInput value={value.document_version_id} onChange={(document_version_id) => onChange({ document_version_id })} /></Field>
        <Field label="Revision number"><TextInput value={value.revision_number} onChange={(revision_number) => onChange({ revision_number })} /></Field>
        <Field label="Revision date"><TextInput type="date" value={value.revision_date} onChange={(revision_date) => onChange({ revision_date })} /></Field>
        <Field label="Document status"><SelectInput value={value.document_status} options={lookups?.drawingStatuses ?? []} onChange={(document_status) => onChange({ document_status })} /></Field>
        <Field label="Current approved"><div className="pt-3"><ToggleInput checked={Boolean(value.current_approved)} onChange={(current_approved) => onChange({ current_approved })} /></div></Field>
        <Field label="Supersedes document"><TextInput value={value.supersedes_document_id} onChange={(supersedes_document_id) => onChange({ supersedes_document_id })} /></Field>
        <Field label="Superseded by document"><TextInput value={value.superseded_by_document_id} onChange={(superseded_by_document_id) => onChange({ superseded_by_document_id })} /></Field>
        <Field label="Issued for review"><TextInput type="date" value={value.issued_for_review_date} onChange={(issued_for_review_date) => onChange({ issued_for_review_date })} /></Field>
        <Field label="Issued for construction"><TextInput type="date" value={value.issued_for_construction_date} onChange={(issued_for_construction_date) => onChange({ issued_for_construction_date })} /></Field>
        <Field label="Issued as-built"><TextInput type="date" value={value.issued_as_built_date} onChange={(issued_as_built_date) => onChange({ issued_as_built_date })} /></Field>
        <Field label="Approval date"><TextInput type="date" value={value.approval_date} onChange={(approval_date) => onChange({ approval_date })} /></Field>
        <Field label="Effective date"><TextInput type="date" value={value.effective_date} onChange={(effective_date) => onChange({ effective_date })} /></Field>
        <Field label="Document language"><TextInput value={value.document_language} onChange={(document_language) => onChange({ document_language })} /></Field>
        <Field label="File type"><TextInput value={value.file_type} onChange={(file_type) => onChange({ file_type })} /></Field>
        <Field label="Source system/reference"><TextInput value={value.source_system_reference} onChange={(source_system_reference) => onChange({ source_system_reference })} /></Field>
        <Field label="Revision notes"><TextInput value={value.revision_notes} onChange={(revision_notes) => onChange({ revision_notes })} /></Field>
      </div>
    </PsiCard>
  );
}
