import { PsiCard } from '../../shared/PsiUi';
import type { EquipmentDesignLookups } from '../../types/equipment-design.types';

const inputClass = 'rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm disabled:opacity-70';

export function EquipmentIdentitySection({ value, lookups, forcedUnitId, onChange }: { value: Record<string, any>; lookups?: EquipmentDesignLookups | undefined; forcedUnitId?: string | undefined; onChange: (patch: Record<string, any>) => void }) {
  return (
    <PsiCard title="1. Equipment Identity" subtitle="Process unit, equipment identity, ownership, safety-critical flags, review dates, and unit/equipment isolation foundation.">
      <div className="grid gap-3 md:grid-cols-3">
        <input required disabled={Boolean(forcedUnitId)} value={value.unit_id ?? forcedUnitId ?? ''} onChange={(e) => onChange({ unit_id: e.target.value })} placeholder="Process unit ID" className={inputClass} />
        <input required value={value.equipment_id ?? ''} onChange={(e) => onChange({ equipment_id: e.target.value })} placeholder="Equipment Registry ID" className={inputClass} />
        <input value={value.area_id ?? ''} onChange={(e) => onChange({ area_id: e.target.value })} placeholder="Area ID" className={inputClass} />
        <input required value={value.equipment_tag ?? ''} onChange={(e) => onChange({ equipment_tag: e.target.value })} placeholder="Equipment tag" className={inputClass} />
        <input required value={value.equipment_name ?? ''} onChange={(e) => onChange({ equipment_name: e.target.value })} placeholder="Equipment name" className={inputClass} />
        <select required value={value.equipment_type ?? ''} onChange={(e) => onChange({ equipment_type: e.target.value })} className={inputClass}><option value="">Equipment type</option>{(lookups?.equipmentTypes ?? []).map((item) => <option key={item}>{item}</option>)}</select>
        <select value={value.equipment_category ?? ''} onChange={(e) => onChange({ equipment_category: e.target.value })} className={inputClass}><option value="">Equipment category</option>{(lookups?.equipmentCategories ?? []).map((item) => <option key={item}>{item}</option>)}</select>
        <input value={value.system_service ?? ''} onChange={(e) => onChange({ system_service: e.target.value })} placeholder="System / service" className={inputClass} />
        <select required value={value.equipment_criticality ?? 'Medium'} onChange={(e) => onChange({ equipment_criticality: e.target.value })} className={inputClass}>{(lookups?.equipmentCriticalities ?? ['Low','Medium','High','Critical']).map((item) => <option key={item}>{item}</option>)}</select>
        <select value={value.status ?? 'Draft'} onChange={(e) => onChange({ status: e.target.value })} className={inputClass}>{['Draft','Active','Under Review','Approved','Archived'].map((item) => <option key={item}>{item}</option>)}</select>
        <label className={`${inputClass} flex items-center gap-2`}><input type="checkbox" checked={Boolean(value.safety_critical)} onChange={(e) => onChange({ safety_critical: e.target.checked })} /> Safety-critical</label>
        <label className={`${inputClass} flex items-center gap-2`}><input type="checkbox" checked={Boolean(value.psm_critical)} onChange={(e) => onChange({ psm_critical: e.target.checked })} /> PSM-critical</label>
        <input value={value.owner_user_id ?? ''} onChange={(e) => onChange({ owner_user_id: e.target.value })} placeholder="Owner user ID" className={inputClass} />
        <input value={value.process_engineer_id ?? ''} onChange={(e) => onChange({ process_engineer_id: e.target.value })} placeholder="Process engineer ID" className={inputClass} />
        <input value={value.mechanical_engineer_id ?? ''} onChange={(e) => onChange({ mechanical_engineer_id: e.target.value })} placeholder="Mechanical engineer ID" className={inputClass} />
        <input value={value.mi_owner_id ?? ''} onChange={(e) => onChange({ mi_owner_id: e.target.value })} placeholder="Inspection/MI owner ID" className={inputClass} />
        <input value={value.operations_owner_id ?? ''} onChange={(e) => onChange({ operations_owner_id: e.target.value })} placeholder="Operations owner ID" className={inputClass} />
        <input value={value.hse_reviewer_id ?? ''} onChange={(e) => onChange({ hse_reviewer_id: e.target.value })} placeholder="HSE/process safety reviewer ID" className={inputClass} />
        <input type="date" value={value.last_review_date ?? ''} onChange={(e) => onChange({ last_review_date: e.target.value })} className={inputClass} />
        <input type="date" value={value.next_review_due ?? ''} onChange={(e) => onChange({ next_review_due: e.target.value })} className={inputClass} />
        <textarea value={value.notes ?? ''} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Notes" className={`${inputClass} min-h-20 md:col-span-3`} />
      </div>
    </PsiCard>
  );
}
