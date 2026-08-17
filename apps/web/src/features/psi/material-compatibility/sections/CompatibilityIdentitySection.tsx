import { FieldGrid, SelectInput, TextArea, TextInput, Toggle } from '../MaterialCompatibilityPrimitives';
import { PsiCard } from '../../shared/PsiUi';
import type { MaterialCompatibilityLookups } from '../../types/material-compatibility.types';

export function CompatibilityIdentitySection({ value, lookups, forcedUnitId, onChange }: { value: Record<string, any>; lookups: MaterialCompatibilityLookups; forcedUnitId?: string | undefined; onChange: (patch: Record<string, any>) => void }) {
  return (
    <PsiCard title="1. Compatibility Identity" subtitle="Record identity, scope, site/unit/equipment/chemical relationship, criticality, owner, review dates, and MOC/PSSR/MI flags.">
      <FieldGrid>
        <TextInput label="Compatibility title" value={value.compatibility_title} onChange={(compatibility_title) => onChange({ compatibility_title })} />
        <TextInput label="Unit ID" value={forcedUnitId ?? value.unit_id} onChange={(unit_id) => onChange({ unit_id })} />
        <TextInput label="Area ID" value={value.area_id} onChange={(area_id) => onChange({ area_id })} />
        <TextInput label="Equipment ID" value={value.equipment_id} onChange={(equipment_id) => onChange({ equipment_id })} />
        <TextInput label="Chemical ID" value={value.chemical_id} onChange={(chemical_id) => onChange({ chemical_id })} />
        <SelectInput label="Compatibility scope" value={value.compatibility_scope} options={lookups.compatibilityScopes} onChange={(compatibility_scope) => onChange({ compatibility_scope })} />
        <SelectInput label="Component type" value={value.component_type} options={lookups.componentTypes} onChange={(component_type) => onChange({ component_type })} />
        <TextInput label="System / service" value={value.system_service} onChange={(system_service) => onChange({ system_service })} />
        <TextInput label="Owner user ID" value={value.owner_user_id} onChange={(owner_user_id) => onChange({ owner_user_id })} />
        <TextInput label="Next review due" type="date" value={value.next_review_due} onChange={(next_review_due) => onChange({ next_review_due })} />
        <SelectInput label="Criticality" value={value.criticality} options={['Low', 'Medium', 'High', 'Critical']} onChange={(criticality) => onChange({ criticality })} />
        <SelectInput label="Compatibility status" value={value.compatibility_status} options={['Draft', 'Active', 'Pending Review', 'Approved', 'Rejected', 'Archived']} onChange={(compatibility_status) => onChange({ compatibility_status })} />
        <Toggle label="Safety critical" checked={value.safety_critical} onChange={(safety_critical) => onChange({ safety_critical })} />
        <Toggle label="PSM critical" checked={value.psm_critical} onChange={(psm_critical) => onChange({ psm_critical })} />
        <Toggle label="MOC required" checked={value.moc_update_required} onChange={(moc_update_required) => onChange({ moc_update_required })} />
        <Toggle label="PSSR blocker" checked={value.pssr_blocker} onChange={(pssr_blocker) => onChange({ pssr_blocker })} />
        <Toggle label="MI readiness impact" checked={value.mi_readiness_impact} onChange={(mi_readiness_impact) => onChange({ mi_readiness_impact })} />
        <TextArea label="Compatibility notes" value={value.compatibility_notes} onChange={(compatibility_notes) => onChange({ compatibility_notes })} />
      </FieldGrid>
    </PsiCard>
  );
}
