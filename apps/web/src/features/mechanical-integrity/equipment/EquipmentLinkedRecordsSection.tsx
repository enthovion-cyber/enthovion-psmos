import type { EquipmentFormState } from './EquipmentForm';
import { Section } from './EquipmentBasicInfoSection';

export function EquipmentLinkedRecordsSection(_: { values: EquipmentFormState; onChange: (patch: Partial<EquipmentFormState>) => void }) {
  return (
    <Section title="Linked Records / Documents">
      <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-sm text-[var(--psm-muted)] md:col-span-2 xl:col-span-3">Document Control, MOC, PSSR, HAZOP/PHA, LOPA/SIL, Incident, PTW/LOTO, SDS/Chemical and Action/CAPA links are stored through backend linked-record/document APIs after equipment creation.</div>
    </Section>
  );
}
