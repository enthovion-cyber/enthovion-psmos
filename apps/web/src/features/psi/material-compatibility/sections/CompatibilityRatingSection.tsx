import { FieldGrid, SelectInput, TextArea, TextInput, Toggle } from '../MaterialCompatibilityPrimitives';
import { PsiCard } from '../../shared/PsiUi';
import type { MaterialCompatibilityLookups } from '../../types/material-compatibility.types';

export function CompatibilityRatingSection({ value, lookups, onChange }: { value: Record<string, any>; lookups: MaterialCompatibilityLookups; onChange: (patch: Record<string, any>) => void }) {
  return (
    <PsiCard title="4. Compatibility Rating" subtitle="Backend stores the rating basis and generates risk, conflict, MOC/PSSR, MI, and review impacts; frontend never hardcodes compatibility logic.">
      <FieldGrid>
        <SelectInput label="Compatibility rating" value={value.compatibility_rating} options={lookups.compatibilityRatings} onChange={(compatibility_rating) => onChange({ compatibility_rating })} />
        <SelectInput label="Rating confidence" value={value.rating_confidence} options={lookups.ratingConfidence} onChange={(rating_confidence) => onChange({ rating_confidence })} />
        <SelectInput label="Compatibility basis" value={value.rating_basis} options={lookups.compatibilityBasis} onChange={(rating_basis) => onChange({ rating_basis })} />
        <TextInput label="Basis reference" value={value.basis_reference} onChange={(basis_reference) => onChange({ basis_reference })} />
        <TextInput label="Rated by" value={value.rated_by} onChange={(rated_by) => onChange({ rated_by })} />
        <TextInput label="Rated at" type="date" value={value.rated_at} onChange={(rated_at) => onChange({ rated_at })} />
        <TextInput label="Allowed duration / temporary use limit" value={value.allowed_duration} onChange={(allowed_duration) => onChange({ allowed_duration })} />
        <Toggle label="Exception approved" checked={value.exception_approved} onChange={(exception_approved) => onChange({ exception_approved })} />
        <TextArea label="Rating notes / engineering judgment" value={value.rating_notes} onChange={(rating_notes) => onChange({ rating_notes })} />
        <TextArea label="Conditions for use" value={value.conditions_for_use} onChange={(conditions_for_use) => onChange({ conditions_for_use })} />
      </FieldGrid>
    </PsiCard>
  );
}

