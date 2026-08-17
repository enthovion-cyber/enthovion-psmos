import { RegulatoryFormSection, RegulatorySelectField, RegulatoryTextField, RegulatoryTextareaField } from './RegulatoryFormSection';
import type { RegulatoryLookups } from '../types/regulatory.types';

export function RegulatoryScopeApplicabilitySection({ form, setForm, lookups }: { form: Record<string, unknown>; setForm: (value: Record<string, unknown>) => void; lookups?: RegulatoryLookups | undefined }) {
  return (
    <RegulatoryFormSection title="3. Scope / Applicability Foundation" subtitle="Company/site/unit/area/equipment scope and foundation applicability status.">
      <RegulatoryTextField label="Site ID" name="site_id" form={form} setForm={setForm} helper="Backend enforces selected site access." />
      <RegulatoryTextField label="Department ID" name="department_id" form={form} setForm={setForm} />
      <RegulatoryTextField label="Unit ID" name="unit_id" form={form} setForm={setForm} />
      <RegulatoryTextField label="Area ID" name="area_id" form={form} setForm={setForm} />
      <RegulatoryTextField label="Equipment ID" name="equipment_id" form={form} setForm={setForm} />
      <RegulatoryTextField label="Process / system" name="process_system" form={form} setForm={setForm} />
      <RegulatoryTextField label="Chemical / substance" name="chemical_substance" form={form} setForm={setForm} />
      <RegulatoryTextField label="Activity / operation" name="activity_operation" form={form} setForm={setForm} />
      <RegulatorySelectField label="Applicability status" name="applicability_status" options={lookups?.applicabilityStatuses} form={form} setForm={setForm} />
      <div className="md:col-span-2 xl:col-span-3">
        <RegulatoryTextareaField label="Applicability rationale" name="applicability_rationale" form={form} setForm={setForm} helper="Required by backend for Not Applicable decisions." />
      </div>
    </RegulatoryFormSection>
  );
}
