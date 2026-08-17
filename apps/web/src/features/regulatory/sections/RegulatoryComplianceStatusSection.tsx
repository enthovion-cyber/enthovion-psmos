import type { RegulatoryLookups } from '../types/regulatory.types';
import { RegulatoryFormSection, RegulatorySelectField, RegulatoryTextareaField } from './RegulatoryFormSection';

export function RegulatoryComplianceStatusSection({ form, setForm, lookups }: { form: Record<string, unknown>; setForm: (value: Record<string, unknown>) => void; lookups?: RegulatoryLookups | undefined }) {
  return (
    <RegulatoryFormSection title="6. Compliance Status Foundation" subtitle="Foundation-only compliance state; detailed obligation/evidence workflow comes in later phases.">
      <RegulatorySelectField label="Register status" name="register_status" options={lookups?.registerStatuses} form={form} setForm={setForm} />
      <RegulatorySelectField label="Compliance status" name="compliance_status" options={lookups?.complianceStatuses} form={form} setForm={setForm} />
      <RegulatorySelectField label="Review status" name="review_status" options={lookups?.reviewStatuses} form={form} setForm={setForm} />
      <div className="md:col-span-2 xl:col-span-3">
        <RegulatoryTextareaField label="Status rationale" name="status_rationale" form={form} setForm={setForm} helper="Required by backend when changing compliance/applicability status." />
      </div>
      <div className="md:col-span-2 xl:col-span-3">
        <RegulatoryTextareaField label="Evidence summary foundation" name="evidence_summary_foundation" form={form} setForm={setForm} />
      </div>
      <div className="md:col-span-2 xl:col-span-3">
        <RegulatoryTextareaField label="Gap summary foundation" name="gap_summary_foundation" form={form} setForm={setForm} />
      </div>
    </RegulatoryFormSection>
  );
}
