import { DeficiencyDetailPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDetailPage';

export default function MechanicalIntegrityDeficiencyDetailPage({ params }: { params: { deficiencyId: string } }) {
  return <DeficiencyDetailPage deficiencyId={params.deficiencyId} />;
}
