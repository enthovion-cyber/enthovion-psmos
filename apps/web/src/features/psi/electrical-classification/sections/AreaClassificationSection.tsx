'use client';

import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalLookups } from '../../types/electrical-classification.types';
import { ElectricalFieldGrid } from '../ElectricalFieldGrid';

export function AreaClassificationSection({ value, lookups, onChange }: { value: Record<string, any>; lookups: ElectricalLookups; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="3. Area Classification" subtitle="IEC Zone or NEC class/division outcome, gas/dust group, temperature class, extent, boundaries, and classification basis."><ElectricalFieldGrid value={value} onChange={onChange} fields={[
    { key: 'zone_classification', label: 'Zone classification', type: 'select', options: lookups.zones }, { key: 'nec_class_division', label: 'NEC class/division', type: 'select', options: lookups.classDivisions }, { key: 'gas_group', label: 'Gas group', type: 'select', options: lookups.gasGroups }, { key: 'dust_group', label: 'Dust group', type: 'select', options: lookups.dustGroups }, { key: 'temperature_class', label: 'Temperature class', type: 'select', options: lookups.temperatureClasses }, { key: 'equipment_protection_level', label: 'Required EPL' }, { key: 'classified_extent_horizontal_m', label: 'Horizontal extent (m)', type: 'number' }, { key: 'classified_extent_vertical_m', label: 'Vertical extent (m)', type: 'number' }, { key: 'boundary_description', label: 'Boundary description' }, { key: 'adjacent_area_impact', label: 'Adjacent area impact' }, { key: 'classification_basis', label: 'Classification basis', type: 'textarea' }
  ]} /></PsiCard>;
}
