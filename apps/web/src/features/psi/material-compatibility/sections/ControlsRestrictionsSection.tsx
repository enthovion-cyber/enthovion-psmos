import { FieldGrid, TextArea, TextInput, Toggle } from '../MaterialCompatibilityPrimitives';
import { PsiCard } from '../../shared/PsiUi';

export function ControlsRestrictionsSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  return (
    <PsiCard title="6. Controls / Restrictions" subtitle="Operating windows, concentration/pH/temperature restrictions, inspection/proof-test controls, MOC/PSSR/MI blockers, alternate material, upgrade need, and action requirements.">
      <FieldGrid>
        <TextArea label="Operating restrictions" value={value.operating_restrictions} onChange={(operating_restrictions) => onChange({ operating_restrictions })} />
        <TextInput label="Max temperature allowed" type="number" value={value.max_temperature_allowed} onChange={(max_temperature_allowed) => onChange({ max_temperature_allowed })} />
        <TextInput label="Max concentration allowed" type="number" value={value.max_concentration_allowed} onChange={(max_concentration_allowed) => onChange({ max_concentration_allowed })} />
        <TextInput label="pH range allowed" value={value.ph_range_allowed} onChange={(ph_range_allowed) => onChange({ ph_range_allowed })} />
        <TextInput label="Required inspection / MI control" value={value.required_inspection_control} onChange={(required_inspection_control) => onChange({ required_inspection_control })} />
        <TextInput label="Alternate material" value={value.alternate_material} onChange={(alternate_material) => onChange({ alternate_material })} />
        <Toggle label="Material upgrade required" checked={value.material_upgrade_required} onChange={(material_upgrade_required) => onChange({ material_upgrade_required })} />
        <Toggle label="MOC required before use/change" checked={value.moc_required} onChange={(moc_required) => onChange({ moc_required })} />
        <Toggle label="PSSR required before startup" checked={value.pssr_required} onChange={(pssr_required) => onChange({ pssr_required })} />
        <Toggle label="Required action / CAPA" checked={value.required_action} onChange={(required_action) => onChange({ required_action })} />
        <TextArea label="Restriction basis / review notes" value={value.restriction_basis} onChange={(restriction_basis) => onChange({ restriction_basis })} />
      </FieldGrid>
    </PsiCard>
  );
}

