import { DeficiencyDetailPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDetailPage';

export default function MechanicalIntegrityReviewDeficiencyPage({ params }: { params: { deficiencyId: string } }) {
  return <DeficiencyDetailPage deficiencyId={params.deficiencyId} mode="review" />;
}
