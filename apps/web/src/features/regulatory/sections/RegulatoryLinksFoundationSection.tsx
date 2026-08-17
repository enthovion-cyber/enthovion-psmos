import { RegulatoryFormSection, RegulatoryTextField, RegulatoryTextareaField } from './RegulatoryFormSection';

export function RegulatoryLinksFoundationSection({ form, setForm }: { form: Record<string, unknown>; setForm: (value: Record<string, unknown>) => void }) {
  return (
    <RegulatoryFormSection title="7. Links Foundation" subtitle="Foundation counters and notes for audit, evidence, actions, and related records. Actual linked records use backend link APIs after save.">
      <RegulatoryTextField label="Linked audit count" name="linked_audit_count" type="number" form={form} setForm={setForm} />
      <RegulatoryTextField label="Linked evidence count" name="linked_evidence_count" type="number" form={form} setForm={setForm} />
      <RegulatoryTextField label="Linked action/CAPA count" name="linked_action_count" type="number" form={form} setForm={setForm} />
      <div className="md:col-span-2 xl:col-span-3">
        <RegulatoryTextareaField label="Notes" name="notes" form={form} setForm={setForm} />
      </div>
    </RegulatoryFormSection>
  );
}
