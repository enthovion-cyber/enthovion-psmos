import { EquipmentDesignFieldGrid, valueOf } from '../EquipmentDesignFieldGrid';
import { PsiCard } from '../../shared/PsiUi';
import type { EquipmentDesignDetail } from '../../types/equipment-design.types';

export function MechanicalMaterialBasisTab({ detail }: { detail: EquipmentDesignDetail }) {
  const material = detail.materialBasis;
  return (
    <PsiCard title="Mechanical / Material Basis" subtitle="Metallurgy, thickness, corrosion allowance, lining/coating, CUI, NDE, inspection, and MI readiness foundation.">
      <EquipmentDesignFieldGrid items={[
        { label: 'Material of construction', value: valueOf(material, 'material_of_construction'), tone: valueOf(material, 'material_of_construction') === 'Not provided' ? 'warn' : 'normal' },
        { label: 'Shell material', value: valueOf(material, 'shell_material') },
        { label: 'Head material', value: valueOf(material, 'head_material') },
        { label: 'Tube material', value: valueOf(material, 'tube_material') },
        { label: 'Corrosion allowance', value: `${valueOf(material, 'corrosion_allowance', '-')} ${valueOf(material, 'corrosion_allowance_unit', '')}` },
        { label: 'Nominal thickness', value: `${valueOf(material, 'nominal_thickness', '-')} ${valueOf(material, 'thickness_unit', '')}` },
        { label: 'Minimum required thickness', value: valueOf(material, 'minimum_required_thickness') },
        { label: 'CUI susceptibility', value: valueOf(material, 'cui_susceptibility') },
        { label: 'Lining / coating', value: valueOf(material, 'lining_coating') },
        { label: 'Fireproofing requirement', value: valueOf(material, 'fireproofing_requirement') },
        { label: 'NDE requirement', value: valueOf(material, 'nde_requirement') },
        { label: 'Inspection requirement', value: valueOf(material, 'inspection_requirement') },
        { label: 'Compatibility notes', value: valueOf(material, 'material_compatibility_notes') }
      ]} />
    </PsiCard>
  );
}
