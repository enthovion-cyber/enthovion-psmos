import type { EquipmentFormState } from './EquipmentForm';
import { Section } from './EquipmentBasicInfoSection';
import { Field, TextInput } from './form-controls';

export function EquipmentSafeguardRoleSection({ values, onChange }: { values: EquipmentFormState; onChange: (patch: Partial<EquipmentFormState>) => void }) {
  return (
    <Section title="Safety-Critical / Safeguard Role">
      <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={!!values.isSafeguard} onChange={(event) => onChange({ isSafeguard: event.target.checked })} /> Is safeguard</label>
      <Field label="Safeguard type"><TextInput value={values.safeguardType} onChange={(safeguardType) => onChange({ safeguardType })} /></Field>
      <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={!!values.isIplCandidate} onChange={(event) => onChange({ isIplCandidate: event.target.checked })} /> IPL candidate</label>
      <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><input type="checkbox" checked={!!values.proofTestRequired} onChange={(event) => onChange({ proofTestRequired: event.target.checked })} /> Proof test required</label>
    </Section>
  );
}
