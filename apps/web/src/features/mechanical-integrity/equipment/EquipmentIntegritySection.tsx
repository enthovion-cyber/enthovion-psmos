import type { EquipmentFormState } from './EquipmentForm';
import { Section } from './EquipmentBasicInfoSection';
import { Field, SelectInput } from './form-controls';

export function EquipmentIntegritySection({ values, onChange }: { values: EquipmentFormState; onChange: (patch: Partial<EquipmentFormState>) => void }) {
  return (
    <Section title="Integrity / Criticality">
      <Field label="Criticality"><SelectInput value={values.criticality} onChange={(criticality) => onChange({ criticality })} options={['LOW','MEDIUM','HIGH','SAFETY_CRITICAL']} /></Field>
      <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={!!values.safetyCritical} onChange={(event) => onChange({ safetyCritical: event.target.checked })} /> Safety-critical equipment</label>
      <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={!!values.psmCritical} onChange={(event) => onChange({ psmCritical: event.target.checked })} /> PSM-critical equipment</label>
    </Section>
  );
}
