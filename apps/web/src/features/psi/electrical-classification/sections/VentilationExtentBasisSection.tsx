'use client';

import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalLookups } from '../../types/electrical-classification.types';
import { ElectricalFieldGrid } from '../ElectricalFieldGrid';

export function VentilationExtentBasisSection({ value, lookups, onChange }: { value: Record<string, any>; lookups: ElectricalLookups; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="4. Ventilation / Extent Basis" subtitle="Ventilation type, availability, effectiveness, enclosure/open area basis, calculations, assumptions, and missing-basis blockers."><ElectricalFieldGrid value={value} onChange={onChange} fields={[
    { key: 'ventilation_type', label: 'Ventilation type', type: 'select', options: lookups.ventilationTypes }, { key: 'ventilation_availability', label: 'Ventilation availability' }, { key: 'ventilation_effectiveness', label: 'Ventilation effectiveness' }, { key: 'air_changes_per_hour', label: 'Air changes per hour', type: 'number' }, { key: 'enclosure_type', label: 'Enclosure type' }, { key: 'open_area_credit_taken', label: 'Open area credit taken', type: 'checkbox' }, { key: 'ventilation_alarm_required', label: 'Ventilation alarm required', type: 'checkbox' }, { key: 'basis_document_reference', label: 'Basis document reference' }, { key: 'assumptions', label: 'Assumptions' }, { key: 'extent_calculation_notes', label: 'Extent calculation notes', type: 'textarea' }
  ]} /></PsiCard>;
}
