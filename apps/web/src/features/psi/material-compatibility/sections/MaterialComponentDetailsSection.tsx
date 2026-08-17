import { FieldGrid, SelectInput, TextArea, TextInput, Toggle } from '../MaterialCompatibilityPrimitives';
import { PsiCard } from '../../shared/PsiUi';
import type { MaterialCompatibilityLookups } from '../../types/material-compatibility.types';

export function MaterialComponentDetailsSection({ value, lookups, onChange }: { value: Record<string, any>; lookups: MaterialCompatibilityLookups; onChange: (patch: Record<string, any>) => void }) {
  return (
    <PsiCard title="3. Material / Component Details" subtitle="Material family, grade, metallurgy, elastomer/seal/gasket/lining/coating, component duty, thickness, corrosion allowance, and design/MI references.">
      <FieldGrid>
        <SelectInput label="Material family" value={value.material_family} options={lookups.materialFamilies} onChange={(material_family) => onChange({ material_family })} />
        <TextInput label="Material grade/specification" value={value.material_grade} onChange={(material_grade) => onChange({ material_grade })} />
        <TextInput label="Material standard" value={value.material_standard} onChange={(material_standard) => onChange({ material_standard })} />
        <TextInput label="Component tag / name" value={value.component_tag} onChange={(component_tag) => onChange({ component_tag })} />
        <TextInput label="Wetted part description" value={value.wetted_part_description} onChange={(wetted_part_description) => onChange({ wetted_part_description })} />
        <TextInput label="Gasket material" value={value.gasket_material} onChange={(gasket_material) => onChange({ gasket_material })} />
        <TextInput label="Seal material" value={value.seal_material} onChange={(seal_material) => onChange({ seal_material })} />
        <TextInput label="Elastomer material" value={value.elastomer_material} onChange={(elastomer_material) => onChange({ elastomer_material })} />
        <TextInput label="Lining / coating" value={value.lining_coating} onChange={(lining_coating) => onChange({ lining_coating })} />
        <TextInput label="Corrosion allowance" type="number" value={value.corrosion_allowance} onChange={(corrosion_allowance) => onChange({ corrosion_allowance })} />
        <TextInput label="Minimum thickness" type="number" value={value.minimum_thickness} onChange={(minimum_thickness) => onChange({ minimum_thickness })} />
        <TextInput label="Design basis reference" value={value.design_basis_reference} onChange={(design_basis_reference) => onChange({ design_basis_reference })} />
        <TextInput label="MI inspection reference" value={value.mi_inspection_reference} onChange={(mi_inspection_reference) => onChange({ mi_inspection_reference })} />
        <Toggle label="Pressure boundary" checked={value.pressure_boundary} onChange={(pressure_boundary) => onChange({ pressure_boundary })} />
        <Toggle label="Safety-critical component" checked={value.safety_critical_component} onChange={(safety_critical_component) => onChange({ safety_critical_component })} />
        <TextArea label="Material notes" value={value.material_notes} onChange={(material_notes) => onChange({ material_notes })} />
      </FieldGrid>
    </PsiCard>
  );
}

