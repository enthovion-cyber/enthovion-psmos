import type { EquipmentFormState } from './EquipmentForm';
import { Section } from './EquipmentBasicInfoSection';
import { Field, TextInput } from './form-controls';

export function EquipmentClassificationSection({ values, onChange }: { values: EquipmentFormState; onChange: (patch: Partial<EquipmentFormState>) => void }) {
  return (
    <Section title="Equipment Classification">
      <Field label="Classification"><TextInput value={values.classification} onChange={(classification) => onChange({ classification })} placeholder="Pressure vessel, tank, piping..." /></Field>
      <Field label="Hazard class"><TextInput value={values.hazardClass} onChange={(hazardClass) => onChange({ hazardClass })} /></Field>
      <Field label="Area classification"><TextInput value={values.areaClassification} onChange={(areaClassification) => onChange({ areaClassification })} /></Field>
    </Section>
  );
}
