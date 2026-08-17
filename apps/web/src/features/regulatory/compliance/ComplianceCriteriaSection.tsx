import { RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';
import type { RegulatoryComplianceLookups } from '../types/regulatory-compliance.types';

export function ComplianceCriteriaSection({ form, setForm, lookups }: { form: Record<string, unknown>; setForm: (form: Record<string, unknown>) => void; lookups?: RegulatoryComplianceLookups | undefined }) {
  return <div className="grid gap-3 md:grid-cols-2"><RegulatoryField label="Criteria status"><select className={regulatoryInputClass()} value={String(form.criteriaStatus ?? 'Not Checked')} onChange={(event) => setForm({ ...form, criteriaStatus: event.target.value })}>{lookups?.complianceCriteriaStatuses?.map((value) => <option key={value}>{value}</option>)}</select></RegulatoryField><RegulatoryField label="Criteria summary"><textarea className={regulatoryInputClass()} value={String(form.criteriaSummary ?? '')} onChange={(event) => setForm({ ...form, criteriaSummary: event.target.value })} /></RegulatoryField></div>;
}
