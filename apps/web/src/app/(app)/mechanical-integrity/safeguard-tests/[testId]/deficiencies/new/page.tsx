import { DeficiencyFormPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyFormPage';

export default function MechanicalIntegrityNewSafeguardTestDeficiencyPage({ params }: { params: { testId: string } }) {
  return <DeficiencyFormPage preset={{ sourceModule: 'Safeguard Test', sourceRecordId: params.testId }} />;
}
