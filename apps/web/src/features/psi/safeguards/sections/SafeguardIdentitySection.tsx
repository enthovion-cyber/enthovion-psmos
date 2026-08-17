import { PsiCard } from '../../shared/PsiUi';
import type { SafeguardLookups } from '../../types/safeguard.types';
import { FieldGrid, SelectInput, TextArea, TextInput, Toggle } from '../SafeguardPrimitives';

export function SafeguardIdentitySection({ value, lookups, forcedUnitId, onChange }: { value: Record<string, any>; lookups: SafeguardLookups; forcedUnitId?: string | undefined; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="1. Safeguard Identity" subtitle="Title, tag, unit, area/equipment, category, type, criticality, owners, review dates, and safety-critical foundation."><FieldGrid>
    <TextInput label="Safeguard title" value={value.safeguard_title} onChange={(safeguard_title) => onChange({ safeguard_title })} />
    <TextInput label="Safeguard tag / reference number" value={value.safeguard_tag} onChange={(safeguard_tag) => onChange({ safeguard_tag })} />
    <TextInput label="Process unit" value={forcedUnitId ?? value.unit_id} onChange={(unit_id) => onChange({ unit_id })} />
    <TextInput label="Area" value={value.area_id} onChange={(area_id) => onChange({ area_id })} />
    <TextInput label="Equipment optional" value={value.equipment_id} onChange={(equipment_id) => onChange({ equipment_id })} />
    <TextInput label="System / service" value={value.system_service} onChange={(system_service) => onChange({ system_service })} />
    <SelectInput label="Safeguard category" value={value.safeguard_category} options={lookups.categories} onChange={(safeguard_category) => onChange({ safeguard_category })} />
    <SelectInput label="Safeguard type" value={value.safeguard_type} options={lookups.types} onChange={(safeguard_type) => onChange({ safeguard_type })} />
    <SelectInput label="Function type" value={value.function_type} options={lookups.functionTypes} onChange={(function_type) => onChange({ function_type })} />
    <SelectInput label="Criticality" value={value.criticality} options={lookups.criticalities} onChange={(criticality) => onChange({ criticality })} />
    <SelectInput label="Status" value={value.status} options={['Draft', 'Active', 'Pending Review', 'Approved', 'Rejected', 'Archived']} onChange={(status) => onChange({ status })} />
    <TextInput label="Owner" value={value.owner_user_id} onChange={(owner_user_id) => onChange({ owner_user_id })} />
    <TextInput label="Process engineer" value={value.process_engineer_id} onChange={(process_engineer_id) => onChange({ process_engineer_id })} />
    <TextInput label="Controls / instrument engineer" value={value.controls_engineer_id} onChange={(controls_engineer_id) => onChange({ controls_engineer_id })} />
    <TextInput label="Mechanical / MI owner" value={value.mechanical_mi_owner_id} onChange={(mechanical_mi_owner_id) => onChange({ mechanical_mi_owner_id })} />
    <TextInput label="Operations owner" value={value.operations_owner_id} onChange={(operations_owner_id) => onChange({ operations_owner_id })} />
    <TextInput label="HSE / process safety reviewer" value={value.hse_reviewer_id} onChange={(hse_reviewer_id) => onChange({ hse_reviewer_id })} />
    <TextInput label="Last review date" type="date" value={value.last_review_date} onChange={(last_review_date) => onChange({ last_review_date })} />
    <TextInput label="Next review due" type="date" value={value.next_review_due} onChange={(next_review_due) => onChange({ next_review_due })} />
    <Toggle label="Safety-critical" checked={value.safety_critical} onChange={(safety_critical) => onChange({ safety_critical })} />
    <Toggle label="PSM-critical" checked={value.psm_critical} onChange={(psm_critical) => onChange({ psm_critical })} />
    <Toggle label="IPL candidate" checked={value.ipl_candidate} onChange={(ipl_candidate) => onChange({ ipl_candidate })} />
    <TextArea label="Notes" value={value.notes} onChange={(notes) => onChange({ notes })} />
  </FieldGrid></PsiCard>;
}
