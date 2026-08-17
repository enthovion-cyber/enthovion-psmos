import { DeficiencyFormPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyFormPage';

export default function MechanicalIntegrityEditDeficiencyPage({ params }: { params: { deficiencyId: string } }) {
  return <DeficiencyFormPage deficiencyId={params.deficiencyId} />;
}
