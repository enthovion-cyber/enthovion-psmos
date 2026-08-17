import type { EquipmentFormState } from './EquipmentForm';
import { Section } from './EquipmentBasicInfoSection';
import { Field, TextInput } from './form-controls';

export function EquipmentLocationSection({ values, onChange }: { values: EquipmentFormState; onChange: (patch: Partial<EquipmentFormState>) => void }) {
  return (
    <Section title="Location / Hierarchy">
      <Field label="Site ID" required><TextInput value={values.siteId} onChange={(siteId) => onChange({ siteId })} /></Field>
      <Field label="Process unit ID" required><TextInput value={values.unitId} onChange={(unitId) => onChange({ unitId })} /></Field>
      <Field label="Area ID"><TextInput value={values.areaId} onChange={(areaId) => onChange({ areaId })} /></Field>
      <Field label="Parent equipment ID"><TextInput value={values.parentId} onChange={(parentId) => onChange({ parentId })} /></Field>
      <Field label="Equipment system"><TextInput value={values.systemName} onChange={(systemName) => onChange({ systemName })} /></Field>
      <Field label="Building/location"><TextInput value={values.buildingZone} onChange={(buildingZone) => onChange({ buildingZone })} /></Field>
      <Field label="P&ID reference"><TextInput value={values.designBasisDocumentRef} onChange={(designBasisDocumentRef) => onChange({ designBasisDocumentRef })} /></Field>
    </Section>
  );
}
