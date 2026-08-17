import { CheckboxField, FormSection, SelectField, TextArea, TextField } from './section-fields';
export function SifIdentificationSection({ value, onChange }: { value: any; onChange: (patch: any) => void }) {
  return <FormSection title="SIF Identification" description="Tag, name, lifecycle status, ownership, criticality, and location.">
    <TextField label="SIF tag" value={value.sifTag ?? value.sif_tag} onChange={(sifTag) => onChange({ sifTag })} />
    <TextField label="SIF name" value={value.sifName ?? value.sif_name} onChange={(sifName) => onChange({ sifName })} />
    <SelectField label="SIF type" value={value.sifType ?? value.sif_type} options={['Shutdown', 'Isolation', 'Depressurization', 'Fire and gas', 'Permissive', 'Interlock', 'Other']} onChange={(sifType) => onChange({ sifType })} />
    <SelectField label="Status" value={value.status} options={['Draft', 'Active', 'Degraded', 'Out of Service', 'Archived']} onChange={(status) => onChange({ status })} />
    <TextField label="Company ID" value={value.companyId ?? value.company_id} onChange={(companyId) => onChange({ companyId })} />
    <TextField label="Site ID" value={value.siteId ?? value.site_id} onChange={(siteId) => onChange({ siteId })} />
    <TextField label="Unit ID" value={value.unitId ?? value.unit_id} onChange={(unitId) => onChange({ unitId })} />
    <TextField label="Area ID" value={value.areaId ?? value.area_id} onChange={(areaId) => onChange({ areaId })} />
    <TextField label="Equipment ID" value={value.equipmentId ?? value.equipment_id} onChange={(equipmentId) => onChange({ equipmentId })} />
    <TextField label="Owner user ID" value={value.ownerUserId ?? value.owner_user_id} onChange={(ownerUserId) => onChange({ ownerUserId })} />
    <CheckboxField label="Safety critical" checked={value.safetyCritical ?? value.safety_critical} onChange={(safetyCritical) => onChange({ safetyCritical })} />
    <CheckboxField label="PSM critical" checked={value.psmCritical ?? value.psm_critical} onChange={(psmCritical) => onChange({ psmCritical })} />
    <TextArea label="Description" value={value.description} onChange={(description) => onChange({ description })} />
  </FormSection>;
}
