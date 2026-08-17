import { PsiCard } from '../../shared/PsiUi';

const c = 'rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm';
const nums = ['design_capacity','normal_capacity','design_flow','normal_flow','minimum_flow','maximum_flow','pressure_drop','duty','efficiency','design_inventory_volume','normal_inventory_volume','maximum_intended_inventory'];

export function CapacityPerformanceBasisSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="5. Capacity / Performance Basis" subtitle="Design capacity, flow, volume, duty, performance notes, and equipment-specific heat-exchanger/pump/vessel/tank/column basis.">
    <div className="grid gap-3 md:grid-cols-4">
      {nums.map((field) => <input key={field} type="number" step="any" value={value[field] ?? ''} onChange={(e) => onChange({ [field]: e.target.value })} placeholder={field.replace(/_/g, ' ')} className={c} />)}
      {['capacity_unit','turndown_limit','flow_unit','duty_unit','volume_unit','residence_time'].map((field) => <input key={field} value={value[field] ?? ''} onChange={(e) => onChange({ [field]: e.target.value })} placeholder={field.replace(/_/g, ' ')} className={c} />)}
      <textarea value={value.performance_basis_notes ?? ''} onChange={(e) => onChange({ performance_basis_notes: e.target.value })} placeholder="Performance basis notes and equipment-specific JSON/basis summary" className={`${c} min-h-24 md:col-span-4`} />
    </div>
  </PsiCard>;
}
