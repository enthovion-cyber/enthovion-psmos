import { Field, FieldGrid } from '../MaterialCompatibilityPrimitives';
import { PsiCard } from '../../shared/PsiUi';
import type { MaterialCompatibilityDetail } from '../../types/material-compatibility.types';

export function MaterialComponentDetailsTab({ detail }: { detail: MaterialCompatibilityDetail }) {
  const row = detail.materialDetails ?? {};
  return <PsiCard title="Material / Component Details" subtitle="Material family, grade, wetted component, elastomer/seal/gasket/lining/coating, corrosion allowance, thickness, design basis, and MI links."><FieldGrid>{['material_family','material_grade','material_standard','component_tag','wetted_part_description','gasket_material','seal_material','elastomer_material','lining_coating','corrosion_allowance','minimum_thickness','pressure_boundary','safety_critical_component','design_basis_reference','mi_inspection_reference','material_notes'].map((key) => <Field key={key} label={key.replaceAll('_', ' ')} value={String(row[key] ?? '') || null} warn={row[key] === null || row[key] === undefined || row[key] === ''} />)}</FieldGrid></PsiCard>;
}

