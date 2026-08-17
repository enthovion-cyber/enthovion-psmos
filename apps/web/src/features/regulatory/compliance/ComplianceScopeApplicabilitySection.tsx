import { RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';

export function ComplianceScopeApplicabilitySection({ form, setForm }: { form: Record<string, unknown>; setForm: (form: Record<string, unknown>) => void }) {
  return <div className="grid gap-3 md:grid-cols-3">{['siteId', 'unitId', 'areaId', 'equipmentId'].map((key) => <RegulatoryField key={key} label={key.replace(/Id$/, ' ID')}><input className={regulatoryInputClass()} value={String(form[key] ?? '')} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></RegulatoryField>)}<RegulatoryField label="Applicability snapshot"><input className={regulatoryInputClass()} value={String(form.applicabilityStatusSnapshot ?? '')} onChange={(event) => setForm({ ...form, applicabilityStatusSnapshot: event.target.value })} /></RegulatoryField></div>;
}
