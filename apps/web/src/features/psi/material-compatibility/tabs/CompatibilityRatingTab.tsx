import { CompatibilityCheckPanel } from '../CompatibilityCheckPanel';
import { Field, FieldGrid } from '../MaterialCompatibilityPrimitives';
import { PsiCard } from '../../shared/PsiUi';
import type { MaterialCompatibilityDetail } from '../../types/material-compatibility.types';

export function CompatibilityRatingTab({ detail }: { detail: MaterialCompatibilityDetail }) {
  const row = detail.rating ?? {};
  return <div className="space-y-5"><CompatibilityCheckPanel detail={detail} /><PsiCard title="Compatibility Rating / Basis" subtitle="Rating, confidence, basis, conditions, temporary-use limits, engineering review, exception approval, and notes."><FieldGrid>{['compatibility_rating','rating_confidence','rating_basis','basis_reference','conditions_for_use','allowed_duration','exception_approved','rated_by','rated_at','rating_notes'].map((key) => <Field key={key} label={key.replaceAll('_', ' ')} value={String(row[key] ?? detail.compatibility[key] ?? '') || null} warn={!row[key] && !detail.compatibility[key]} />)}</FieldGrid></PsiCard></div>;
}

