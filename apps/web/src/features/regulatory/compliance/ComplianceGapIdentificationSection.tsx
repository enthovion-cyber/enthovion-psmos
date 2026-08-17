import { RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';

export function ComplianceGapIdentificationSection({ form, setForm }: { form: Record<string, unknown>; setForm: (form: Record<string, unknown>) => void }) {
  return <div className="grid gap-3 md:grid-cols-2"><RegulatoryField label="Gap status"><input className={regulatoryInputClass()} value={String(form.gapStatus ?? 'Not Assessed')} onChange={(event) => setForm({ ...form, gapStatus: event.target.value })} /></RegulatoryField><RegulatoryField label="Gap description"><textarea className={regulatoryInputClass()} value={String(form.gapDescription ?? '')} onChange={(event) => setForm({ ...form, gapDescription: event.target.value })} /></RegulatoryField></div>;
}
