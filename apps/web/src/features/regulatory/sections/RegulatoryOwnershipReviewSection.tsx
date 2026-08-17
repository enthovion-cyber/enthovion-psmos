import type { RegulatoryLookups } from '../types/regulatory.types';
import { RegulatoryFormSection, RegulatorySelectField, RegulatoryTextField } from './RegulatoryFormSection';

export function RegulatoryOwnershipReviewSection({ form, setForm, lookups }: { form: Record<string, unknown>; setForm: (value: Record<string, unknown>) => void; lookups?: RegulatoryLookups | undefined }) {
  return (
    <RegulatoryFormSection title="5. Ownership / Review Cycle" subtitle="Owner, compliance owner, reviewer, and review-cycle foundation.">
      <RegulatoryTextField label="Owner user ID" name="owner_user_id" form={form} setForm={setForm} helper="Must be an active IAM/RBAC user in the same company/site scope." />
      <RegulatoryTextField label="Compliance owner user ID" name="compliance_owner_user_id" form={form} setForm={setForm} />
      <RegulatoryTextField label="Site owner user ID" name="site_owner_user_id" form={form} setForm={setForm} />
      <RegulatoryTextField label="Reviewer user ID" name="reviewer_user_id" form={form} setForm={setForm} />
      <RegulatorySelectField label="Review frequency" name="review_frequency" options={lookups?.reviewFrequencies} form={form} setForm={setForm} />
      <RegulatoryTextField label="Next review date" name="next_review_date" type="date" form={form} setForm={setForm} />
      <RegulatoryTextField label="Last review date" name="last_review_date" type="date" form={form} setForm={setForm} />
    </RegulatoryFormSection>
  );
}
