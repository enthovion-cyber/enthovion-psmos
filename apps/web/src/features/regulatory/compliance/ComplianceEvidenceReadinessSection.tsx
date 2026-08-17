import { RegulatoryField, regulatoryInputClass } from '../shared/RegulatoryUi';
import type { RegulatoryComplianceLookups } from '../types/regulatory-compliance.types';

export function ComplianceEvidenceReadinessSection({ form, setForm, lookups }: { form: Record<string, unknown>; setForm: (form: Record<string, unknown>) => void; lookups?: RegulatoryComplianceLookups | undefined }) {
  return <div className="grid gap-3 md:grid-cols-2"><RegulatoryField label="Evidence readiness"><select className={regulatoryInputClass()} value={String(form.evidenceReadinessStatus ?? 'Not Assessed')} onChange={(event) => setForm({ ...form, evidenceReadinessStatus: event.target.value })}>{lookups?.complianceEvidenceReadinessStatuses?.map((value) => <option key={value}>{value}</option>)}</select></RegulatoryField><RegulatoryField label="Evidence basis / reference"><textarea className={regulatoryInputClass()} value={String(form.decisionBasis ?? '')} onChange={(event) => setForm({ ...form, decisionBasis: event.target.value })} /></RegulatoryField></div>;
}
