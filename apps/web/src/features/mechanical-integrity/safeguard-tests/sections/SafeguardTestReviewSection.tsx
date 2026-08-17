import { FormSection, SelectField, TextArea, TextField } from '../../sif/sections/section-fields';
export function SafeguardTestReviewSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="Review / Approval"><SelectField label="Review status" value={value.reviewStatus ?? value.review_status} options={['Draft', 'Submitted', 'Approved', 'Rejected', 'Returned']} onChange={(reviewStatus) => onChange({ reviewStatus })} /><TextField label="Reviewer user ID" value={value.reviewerUserId ?? value.reviewer_user_id} onChange={(reviewerUserId) => onChange({ reviewerUserId })} /><TextArea label="Review notes" value={value.reviewNotes ?? value.review_notes} onChange={(reviewNotes) => onChange({ reviewNotes })} /></FormSection>;
}
