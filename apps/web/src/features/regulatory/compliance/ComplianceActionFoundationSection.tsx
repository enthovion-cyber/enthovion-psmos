import { RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';

export function ComplianceActionFoundationSection({ form, setForm }: { form: Record<string, unknown>; setForm: (form: Record<string, unknown>) => void }) {
  return <div className="grid gap-3 md:grid-cols-2"><RegulatoryField label="Action foundation note"><textarea className={regulatoryInputClass()} value={String(form.actionFoundationNote ?? '')} onChange={(event) => setForm({ ...form, actionFoundationNote: event.target.value })} /></RegulatoryField><RegulatoryField label="Next review date"><input type="datetime-local" className={regulatoryInputClass()} value={String(form.nextReviewDate ?? '')} onChange={(event) => setForm({ ...form, nextReviewDate: event.target.value })} /></RegulatoryField></div>;
}
