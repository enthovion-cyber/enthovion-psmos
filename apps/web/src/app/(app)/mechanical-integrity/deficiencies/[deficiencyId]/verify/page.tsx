import { DeficiencyDetailPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDetailPage';

export default function MechanicalIntegrityVerifyDeficiencyPage({ params }: { params: { deficiencyId: string } }) {
  return <DeficiencyDetailPage deficiencyId={params.deficiencyId} mode="verify" />;
}
