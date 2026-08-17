import { PsiCard } from '../../shared/PsiUi';
import type { SafeguardLookups } from '../../types/safeguard.types';
import { FieldGrid, SelectInput, TextArea, TextInput, Toggle } from '../SafeguardPrimitives';

export function SafeguardTestingImpairmentSection({ value, lookups, onChange }: { value: Record<string, any>; lookups: SafeguardLookups; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="6. Testing / Monitoring / Impairment Status" subtitle="PSI stores the basis while source status is read from MI/SIS/relief/fire-gas modules where available. Critical overdue/failed/bypassed/impaired safeguards create conflicts."><FieldGrid>
    <Toggle label="Testing required" checked={value.testing_required} onChange={(testing_required) => onChange({ testing_required })} />
    <SelectInput label="Testing source module" value={value.testing_source_module} options={lookups.sourceModules} onChange={(testing_source_module) => onChange({ testing_source_module })} />
    <TextArea label="Test / proof / inspection requirement" value={value.test_proof_inspection_requirement} onChange={(test_proof_inspection_requirement) => onChange({ test_proof_inspection_requirement })} />
    <TextInput label="Last test date" type="date" value={value.last_test_date} onChange={(last_test_date) => onChange({ last_test_date })} />
    <TextInput label="Next test due" type="date" value={value.next_test_due} onChange={(next_test_due) => onChange({ next_test_due })} />
    <SelectInput label="Test status" value={value.test_status} options={lookups.testingStatuses} onChange={(test_status) => onChange({ test_status })} />
    <TextInput label="Monitoring method" value={value.monitoring_method} onChange={(monitoring_method) => onChange({ monitoring_method })} />
    <TextInput label="Inspection requirement" value={value.inspection_requirement} onChange={(inspection_requirement) => onChange({ inspection_requirement })} />
    <TextInput label="Maintenance requirement" value={value.maintenance_requirement} onChange={(maintenance_requirement) => onChange({ maintenance_requirement })} />
    <SelectInput label="Bypass / impairment status" value={value.bypass_impairment_status} options={lookups.testingStatuses} onChange={(bypass_impairment_status) => onChange({ bypass_impairment_status })} />
    <TextInput label="Active bypass / impairment link" value={value.active_bypass_impairment_link} onChange={(active_bypass_impairment_link) => onChange({ active_bypass_impairment_link })} />
    <TextInput label="Bypass authorization requirement" value={value.bypass_authorization_requirement} onChange={(bypass_authorization_requirement) => onChange({ bypass_authorization_requirement })} />
    <TextInput label="Impairment mitigation required" value={value.impairment_mitigation_required} onChange={(impairment_mitigation_required) => onChange({ impairment_mitigation_required })} />
    <TextInput label="Temporary control requirement" value={value.temporary_control_requirement} onChange={(temporary_control_requirement) => onChange({ temporary_control_requirement })} />
    <Toggle label="Readiness impact" checked={value.readiness_impact} onChange={(readiness_impact) => onChange({ readiness_impact })} />
    <TextArea label="Testing / impairment notes" value={value.notes} onChange={(notes) => onChange({ notes })} />
  </FieldGrid></PsiCard>;
}
