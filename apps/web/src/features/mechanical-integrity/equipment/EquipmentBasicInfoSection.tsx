import type { ReactNode } from 'react';
import type { EquipmentFormState } from './EquipmentForm';
import { Field, TextInput, SelectInput } from './form-controls';

export function EquipmentBasicInfoSection({ values, onChange }: { values: EquipmentFormState; onChange: (patch: Partial<EquipmentFormState>) => void }) {
  return (
    <Section title="Basic Information">
      <Field label="Equipment tag number" required><TextInput value={values.tag} onChange={(tag) => onChange({ tag })} /></Field>
      <Field label="Equipment name" required><TextInput value={values.name} onChange={(name) => onChange({ name })} /></Field>
      <Field label="Description"><TextInput value={values.description} onChange={(description) => onChange({ description })} /></Field>
      <Field label="Equipment type" required><TextInput value={values.type} onChange={(type) => onChange({ type })} placeholder="Pressure vessel, pump, PSV..." /></Field>
      <Field label="Equipment category"><TextInput value={values.subtype} onChange={(subtype) => onChange({ subtype })} /></Field>
      <Field label="Manufacturer"><TextInput value={values.manufacturer} onChange={(manufacturer) => onChange({ manufacturer })} /></Field>
      <Field label="Model"><TextInput value={values.model} onChange={(model) => onChange({ model })} /></Field>
      <Field label="Serial number"><TextInput value={values.serialNumber} onChange={(serialNumber) => onChange({ serialNumber })} /></Field>
      <Field label="Asset number"><TextInput value={values.nameplateNumber} onChange={(nameplateNumber) => onChange({ nameplateNumber })} /></Field>
      <Field label="Status"><SelectInput value={values.status} onChange={(status) => onChange({ status })} options={['ACTIVE','INACTIVE','OUT_OF_SERVICE','DECOMMISSIONED']} /></Field>
    </Section>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div></section>;
}
