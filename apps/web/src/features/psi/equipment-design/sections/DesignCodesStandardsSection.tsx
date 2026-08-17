import { PsiCard } from '../../shared/PsiUi';
import type { EquipmentDesignLookups } from '../../types/equipment-design.types';

const c = 'rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm';
const fields = ['code_edition','construction_code','inspection_code','relief_design_code_reference','electrical_instrument_standard_reference','company_standard','licensor_standard','vendor_standard','regulatory_requirement','certification_requirement','third_party_inspection_requirement','code_stamp_certification_number','design_registration_number'];

export function DesignCodesStandardsSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: EquipmentDesignLookups | undefined; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="6. Design Codes / Standards" subtitle="Design, construction, inspection, relief, electrical/instrument, company, licensor, vendor, regulatory, certification, and registration basis.">
    <div className="grid gap-3 md:grid-cols-3">
      <select value={value.design_code ?? ''} onChange={(e) => onChange({ design_code: e.target.value })} className={c}><option value="">Design code</option>{(lookups?.designCodes ?? []).map((item) => <option key={item}>{item}</option>)}</select>
      {fields.map((field) => <input key={field} value={value[field] ?? ''} onChange={(e) => onChange({ [field]: e.target.value })} placeholder={field.replace(/_/g, ' ')} className={c} />)}
      <textarea value={value.codes_notes ?? value.notes ?? ''} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Codes / standards notes" className={`${c} min-h-20 md:col-span-3`} />
    </div>
  </PsiCard>;
}
