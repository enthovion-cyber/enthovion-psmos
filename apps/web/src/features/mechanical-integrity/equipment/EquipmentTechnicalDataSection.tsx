import type { EquipmentFormState } from './EquipmentForm';
import { Section } from './EquipmentBasicInfoSection';
import { Field, TextInput } from './form-controls';

export function EquipmentTechnicalDataSection({ values, onChange }: { values: EquipmentFormState; onChange: (patch: Partial<EquipmentFormState>) => void }) {
  return (
    <Section title="Technical Data">
      <Field label="Design pressure"><TextInput value={values.designPressure} onChange={(designPressure) => onChange({ designPressure })} /></Field>
      <Field label="Design pressure unit"><TextInput value={values.designPressureUnit} onChange={(designPressureUnit) => onChange({ designPressureUnit })} /></Field>
      <Field label="Design temperature"><TextInput value={values.designTemperature} onChange={(designTemperature) => onChange({ designTemperature })} /></Field>
      <Field label="Operating pressure"><TextInput value={values.operatingPressure} onChange={(operatingPressure) => onChange({ operatingPressure })} /></Field>
      <Field label="Operating temperature"><TextInput value={values.operatingTemperature} onChange={(operatingTemperature) => onChange({ operatingTemperature })} /></Field>
      <Field label="Design code"><TextInput value={values.designCode} onChange={(designCode) => onChange({ designCode })} /></Field>
      <Field label="Material of construction"><TextInput value={values.materialOfConstruction} onChange={(materialOfConstruction) => onChange({ materialOfConstruction })} /></Field>
      <Field label="Corrosion allowance"><TextInput value={values.corrosionAllowance} onChange={(corrosionAllowance) => onChange({ corrosionAllowance })} /></Field>
      <Field label="Service fluid"><TextInput value={values.fluidName} onChange={(fluidName) => onChange({ fluidName })} /></Field>
      <Field label="SDS reference"><TextInput value={values.sdsReference} onChange={(sdsReference) => onChange({ sdsReference })} /></Field>
    </Section>
  );
}
