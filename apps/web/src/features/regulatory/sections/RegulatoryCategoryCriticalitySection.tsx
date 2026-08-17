import type { RegulatoryLookups } from '../types/regulatory.types';
import { RegulatoryFormSection, RegulatorySelectField, RegulatoryTextField, RegulatoryTextareaField } from './RegulatoryFormSection';

export function RegulatoryCategoryCriticalitySection({ form, setForm, lookups }: { form: Record<string, unknown>; setForm: (value: Record<string, unknown>) => void; lookups?: RegulatoryLookups | undefined }) {
  return (
    <RegulatoryFormSection title="4. Category / Criticality" subtitle="PSM element, module relationship, criticality, and impact foundation.">
      <RegulatorySelectField label="Category" name="category" options={lookups?.categories} form={form} setForm={setForm} required />
      <RegulatoryTextField label="Topic" name="topic" form={form} setForm={setForm} />
      <RegulatoryTextField label="Related PSM element" name="related_psm_element" form={form} setForm={setForm} />
      <RegulatoryTextField label="Related module" name="related_module" form={form} setForm={setForm} />
      <RegulatorySelectField label="Criticality" name="criticality" options={lookups?.criticalityLevels} form={form} setForm={setForm} required />
      <RegulatoryTextField label="Regulatory impact" name="regulatory_impact" form={form} setForm={setForm} />
      <RegulatoryTextField label="Safety impact" name="safety_impact" form={form} setForm={setForm} />
      <RegulatoryTextField label="Environmental impact" name="environmental_impact" form={form} setForm={setForm} />
      <RegulatoryTextField label="Business impact" name="business_impact" form={form} setForm={setForm} />
      <div className="md:col-span-2 xl:col-span-3">
        <RegulatoryTextareaField label="Risk basis" name="risk_basis" form={form} setForm={setForm} helper="Required for critical/high risk requirements." />
      </div>
    </RegulatoryFormSection>
  );
}
