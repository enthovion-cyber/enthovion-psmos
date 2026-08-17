'use client';

import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalLookups } from '../../types/electrical-classification.types';
import { ElectricalFieldGrid } from '../ElectricalFieldGrid';

export function ProtectionRequirementsSection({ value, lookups, onChange }: { value: Record<string, any>; lookups: ElectricalLookups; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="5. Equipment Protection Requirements" subtitle="Required Ex protection, EPL, gas/dust group, temperature class, ingress/IP, cable glands, certification, and inspection frequency."><ElectricalFieldGrid value={value} onChange={onChange} fields={[
    { key: 'required_protection_method', label: 'Required protection method', type: 'select', options: lookups.protectionMethods }, { key: 'required_ex_marking', label: 'Required Ex marking' }, { key: 'required_epl', label: 'Required EPL' }, { key: 'required_gas_dust_group', label: 'Required gas/dust group' }, { key: 'required_temperature_class', label: 'Required temperature class' }, { key: 'minimum_ip_rating', label: 'Minimum IP rating' }, { key: 'certification_scheme', label: 'Certification scheme' }, { key: 'cable_gland_requirement', label: 'Cable gland requirement' }, { key: 'inspection_frequency', label: 'Inspection frequency' }, { key: 'special_conditions', label: 'Special conditions', type: 'textarea' }
  ]} /></PsiCard>;
}
