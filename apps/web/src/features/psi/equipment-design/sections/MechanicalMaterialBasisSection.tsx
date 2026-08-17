import { PsiCard } from '../../shared/PsiUi';
import type { EquipmentDesignLookups } from '../../types/equipment-design.types';

const c = 'rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm';
const fields = ['shell_material','head_material','tube_material','internal_material','lining_coating','cladding','gasket_material','seal_material','elastomer_material','joint_efficiency','weld_category','insulation_type','fireproofing_requirement','external_coating','internal_coating','cathodic_protection','corrosion_mechanism','nde_requirement','inspection_requirement','special_metallurgy_notes'];

export function MechanicalMaterialBasisSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: EquipmentDesignLookups | undefined; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="4. Mechanical / Material Basis" subtitle="Metallurgy, corrosion allowance, thickness, lining, coating, fireproofing, CUI, NDE, inspection, and MI readiness foundation.">
    <div className="grid gap-3 md:grid-cols-4">
      <select value={value.material_of_construction ?? ''} onChange={(e) => onChange({ material_of_construction: e.target.value })} className={c}><option value="">Material of construction</option>{(lookups?.materials ?? []).map((item) => <option key={item}>{item}</option>)}</select>
      <input type="number" step="any" value={value.corrosion_allowance ?? ''} onChange={(e) => onChange({ corrosion_allowance: e.target.value })} placeholder="Corrosion allowance" className={c} />
      <input value={value.corrosion_allowance_unit ?? ''} onChange={(e) => onChange({ corrosion_allowance_unit: e.target.value })} placeholder="Corrosion allowance unit" className={c} />
      <label className={`${c} flex items-center gap-2`}><input type="checkbox" checked={Boolean(value.cui_susceptibility)} onChange={(e) => onChange({ cui_susceptibility: e.target.checked })} /> CUI susceptibility</label>
      <input type="number" step="any" value={value.nominal_thickness ?? ''} onChange={(e) => onChange({ nominal_thickness: e.target.value })} placeholder="Nominal thickness" className={c} />
      <input type="number" step="any" value={value.minimum_required_thickness ?? ''} onChange={(e) => onChange({ minimum_required_thickness: e.target.value })} placeholder="Minimum required thickness" className={c} />
      <input value={value.thickness_unit ?? ''} onChange={(e) => onChange({ thickness_unit: e.target.value })} placeholder="Thickness unit" className={c} />
      {fields.map((field) => <input key={field} value={value[field] ?? ''} onChange={(e) => onChange({ [field]: e.target.value })} placeholder={field.replace(/_/g, ' ')} className={c} />)}
      <textarea value={value.material_compatibility_notes ?? ''} onChange={(e) => onChange({ material_compatibility_notes: e.target.value })} placeholder="Material compatibility notes" className={`${c} min-h-20 md:col-span-4`} />
    </div>
  </PsiCard>;
}
