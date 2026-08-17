'use client';

import { PsiButton, PsiCard } from '../../shared/PsiUi';
import type { InstalledEquipmentRating } from '../../types/electrical-classification.types';
import { RatingSuitabilityBadge } from '../../components/shared/RatingSuitabilityBadge';
import { ElectricalFieldGrid } from '../ElectricalFieldGrid';

export function InstalledEquipmentRatingSection({ value, draft, onDraftChange, onAdd, onRunRatingCheck, busy }: { value: InstalledEquipmentRating[]; draft: Record<string, any>; onDraftChange: (patch: Record<string, any>) => void; onAdd?: (() => void) | undefined; onRunRatingCheck?: (() => void) | undefined; busy?: boolean | undefined }) {
  return (
    <PsiCard title="6. Installed Equipment / Rating Check" subtitle="Connect installed instruments/equipment, Ex markings, protection methods, gas/dust group, T-class, suitability result, mismatch reason, and action need." action={onRunRatingCheck ? <PsiButton variant="secondary" onClick={onRunRatingCheck} disabled={busy} title={busy ? 'Rating check is running.' : undefined}>Run Rating Check</PsiButton> : null}>
      <ElectricalFieldGrid value={draft} onChange={onDraftChange} fields={[{ key: 'tag_number', label: 'Tag number' }, { key: 'equipment_id', label: 'Equipment registry ID' }, { key: 'item_type', label: 'Item type' }, { key: 'installed_ex_marking', label: 'Installed Ex marking' }, { key: 'installed_protection_method', label: 'Installed protection method' }, { key: 'installed_gas_dust_group', label: 'Installed gas/dust group' }, { key: 'installed_temperature_class', label: 'Installed T-class' }, { key: 'certificate_reference', label: 'Certificate reference' }, { key: 'suitability_result', label: 'Suitability result', type: 'select', options: ['Suitable', 'Suitable With Conditions', 'Mismatch', 'Missing Rating Data', 'Not Required', 'Needs Review'] }, { key: 'mismatch_reason', label: 'Mismatch reason' }, { key: 'action_required', label: 'Action required', type: 'checkbox' }]} />
      {onAdd ? <div className="mt-3"><PsiButton onClick={onAdd} disabled={busy} title={busy ? 'Saving equipment rating.' : undefined}>Add Installed Equipment</PsiButton></div> : null}
      <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--psm-line)]">
        <table className="min-w-full text-left text-sm"><thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="px-3 py-2">Tag</th><th className="px-3 py-2">Ex marking</th><th className="px-3 py-2">Group / T-class</th><th className="px-3 py-2">Suitability</th><th className="px-3 py-2">Action</th></tr></thead><tbody className="divide-y divide-[var(--psm-line)]">{value.length ? value.map((item) => <tr key={item.id}><td className="px-3 py-2 font-semibold">{item.tag_number}</td><td className="px-3 py-2">{item.installed_ex_marking || 'Missing'}</td><td className="px-3 py-2">{item.installed_gas_dust_group || 'Group missing'} / {item.installed_temperature_class || 'T missing'}</td><td className="px-3 py-2"><RatingSuitabilityBadge value={item.suitability_result} /></td><td className="px-3 py-2">{item.action_required ? 'Required' : 'None'}</td></tr>) : <tr><td className="px-3 py-4 text-[var(--psm-muted)]" colSpan={5}>No installed equipment ratings linked yet.</td></tr>}</tbody></table>
      </div>
    </PsiCard>
  );
}
