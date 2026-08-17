'use client';

import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalLookups } from '../../types/electrical-classification.types';
import { ElectricalFieldGrid } from '../ElectricalFieldGrid';

export function HazardousMaterialReleaseSourceSection({ value, lookups, onChange }: { value: Record<string, any>; lookups: ElectricalLookups; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="2. Hazardous Material / Release Source" subtitle="Chemical/SDS source, flammable or combustible properties, release source, grade, operating mode, and release basis."><ElectricalFieldGrid value={value} onChange={onChange} fields={[
    { key: 'hazardous_material_name', label: 'Hazardous material name' }, { key: 'chemical_id', label: 'Chemical/SDS ID' }, { key: 'material_type', label: 'Material type', type: 'select', options: lookups.materialTypes }, { key: 'flash_point_c', label: 'Flash point C', type: 'number' }, { key: 'autoignition_temperature_c', label: 'Autoignition temperature C', type: 'number' }, { key: 'lower_flammable_limit', label: 'Lower flammable limit', type: 'number' }, { key: 'upper_flammable_limit', label: 'Upper flammable limit', type: 'number' }, { key: 'dust_kst', label: 'Dust Kst', type: 'number' }, { key: 'dust_minimum_ignition_energy', label: 'Dust minimum ignition energy' }, { key: 'source_of_release', label: 'Source of release' }, { key: 'release_source_type', label: 'Release source type', type: 'select', options: lookups.releaseSourceTypes }, { key: 'release_grade', label: 'Release grade', type: 'select', options: lookups.releaseGrades }, { key: 'release_frequency', label: 'Release frequency' }, { key: 'release_duration', label: 'Release duration' }, { key: 'operating_mode', label: 'Operating mode' }, { key: 'source_basis', label: 'Release source basis', type: 'textarea' }
  ]} /></PsiCard>;
}
