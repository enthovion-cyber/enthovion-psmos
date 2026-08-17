import type { RegulatoryLookups } from '../types/regulatory.types';
import { RegulatoryFormSection, RegulatorySelectField, RegulatoryTextField, RegulatoryTextareaField } from './RegulatoryFormSection';

export function RegulatoryIdentitySection({ form, setForm, lookups }: { form: Record<string, unknown>; setForm: (value: Record<string, unknown>) => void; lookups?: RegulatoryLookups | undefined }) {
  return (
    <RegulatoryFormSection title="1. Requirement Identity" subtitle="Core legal or regulatory requirement identity, source, reference, and lifecycle dates.">
      <RegulatoryTextField label="Requirement code" name="requirement_code" form={form} setForm={setForm} helper="Leave blank to let backend generate a register code." />
      <RegulatoryTextField label="Requirement title" name="requirement_title" form={form} setForm={setForm} required />
      <RegulatorySelectField label="Source type" name="source_type" options={lookups?.sourceTypes} form={form} setForm={setForm} required />
      <RegulatoryTextField label="Source reference number" name="source_reference_number" form={form} setForm={setForm} />
      <RegulatoryTextField label="Version / revision" name="version" form={form} setForm={setForm} />
      <RegulatoryTextField label="Full reference URL" name="full_reference_url" form={form} setForm={setForm} helper="Backend validates URL format." />
      <RegulatoryTextField label="Effective date" name="effective_date" type="date" form={form} setForm={setForm} />
      <RegulatoryTextField label="Expiry / sunset date" name="expiry_date" type="date" form={form} setForm={setForm} />
      <div className="md:col-span-2 xl:col-span-3">
        <RegulatoryTextareaField label="Short summary" name="short_summary" form={form} setForm={setForm} />
      </div>
    </RegulatoryFormSection>
  );
}
