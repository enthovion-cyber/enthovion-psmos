import type { RegulatoryLookups } from '../types/regulatory.types';
import { RegulatoryFormSection, RegulatorySelectField, RegulatoryTextField } from './RegulatoryFormSection';

export function RegulatoryJurisdictionSection({ form, setForm, lookups }: { form: Record<string, unknown>; setForm: (value: Record<string, unknown>) => void; lookups?: RegulatoryLookups | undefined }) {
  return (
    <RegulatoryFormSection title="2. Jurisdiction / Authority" subtitle="Authority, jurisdiction level, language, and issuing geography.">
      <RegulatorySelectField label="Jurisdiction level" name="jurisdiction_level" options={lookups?.jurisdictionLevels} form={form} setForm={setForm} required />
      <RegulatoryTextField label="Country" name="country" form={form} setForm={setForm} />
      <RegulatoryTextField label="State / province" name="state_province" form={form} setForm={setForm} />
      <RegulatoryTextField label="City / municipality" name="city_municipality" form={form} setForm={setForm} />
      <RegulatoryTextField label="Industrial zone" name="industrial_zone" form={form} setForm={setForm} />
      <RegulatoryTextField label="Authority / issuing body" name="authority_name" form={form} setForm={setForm} />
      <RegulatoryTextField label="Language" name="language" form={form} setForm={setForm} />
    </RegulatoryFormSection>
  );
}
