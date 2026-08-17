'use client';

import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalLookups } from '../../types/electrical-classification.types';
import { ElectricalFieldGrid } from '../ElectricalFieldGrid';

export function ClassificationIdentitySection({ value, lookups, forcedUnitId, onChange }: { value: Record<string, any>; lookups: ElectricalLookups; forcedUnitId?: string | undefined; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="1. Classification Identity" subtitle="Record number, unit/area scope, classification system, standard, responsible engineers, critical flags, and review dates."><ElectricalFieldGrid value={{ ...value, unit_id: forcedUnitId ?? value.unit_id }} onChange={onChange} fields={[
    { key: 'classification_title', label: 'Classification title' }, { key: 'classification_record_number', label: 'Record number' }, { key: 'unit_id', label: 'Unit ID' }, { key: 'area_id', label: 'Area ID' }, { key: 'building_location', label: 'Building / location' }, { key: 'system_service', label: 'System / service' }, { key: 'classification_system', label: 'Classification system', type: 'select', options: lookups.classificationSystems }, { key: 'applicable_standard', label: 'Applicable standard', type: 'select', options: lookups.hazardousAreaStandards }, { key: 'owner_user_id', label: 'Owner user ID' }, { key: 'electrical_engineer_id', label: 'Electrical engineer ID' }, { key: 'last_review_date', label: 'Last review date', type: 'date' }, { key: 'next_review_due', label: 'Next review due', type: 'date' }, { key: 'critical_area', label: 'Critical area', type: 'checkbox' }, { key: 'psm_critical', label: 'PSM critical', type: 'checkbox' }, { key: 'hot_work_restricted', label: 'Hot work restricted', type: 'checkbox' }, { key: 'notes', label: 'Notes', type: 'textarea' }
  ]} /></PsiCard>;
}
