'use client';

import { PsiCard } from '../../shared/PsiUi';
import { ElectricalFieldGrid } from '../ElectricalFieldGrid';

export function PtwIgnitionControlsSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="8. PTW / Ignition Source Controls" subtitle="Hot work restrictions, gas testing, portable equipment controls, non-Ex equipment prohibition, bypass controls, signage, access restriction, and PTW/MOC/PSSR dependencies."><ElectricalFieldGrid value={value} onChange={onChange} fields={[
    { key: 'hot_work_restricted', label: 'Hot work restricted', type: 'checkbox' }, { key: 'hot_work_permit_required', label: 'Hot work permit required', type: 'checkbox' }, { key: 'gas_test_required', label: 'Gas test required', type: 'checkbox' }, { key: 'continuous_monitoring_required', label: 'Continuous monitoring required', type: 'checkbox' }, { key: 'portable_equipment_control_required', label: 'Portable equipment control required', type: 'checkbox' }, { key: 'non_ex_equipment_prohibited', label: 'Non-Ex equipment prohibited', type: 'checkbox' }, { key: 'vehicle_entry_restricted', label: 'Vehicle entry restricted', type: 'checkbox' }, { key: 'bypass_controls_required', label: 'Bypass controls required', type: 'checkbox' }, { key: 'signage_required', label: 'Signage required', type: 'checkbox' }, { key: 'access_restriction_required', label: 'Access restriction required', type: 'checkbox' }, { key: 'ptw_notes', label: 'PTW notes', type: 'textarea' }
  ]} /></PsiCard>;
}
