import { DeficiencyFormPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyFormPage';

export default function MechanicalIntegrityNewReliefTestDeficiencyPage({ params }: { params: { testId: string } }) {
  return <DeficiencyFormPage preset={{ sourceModule: 'Relief Device Test', sourceRecordId: params.testId }} />;
}
