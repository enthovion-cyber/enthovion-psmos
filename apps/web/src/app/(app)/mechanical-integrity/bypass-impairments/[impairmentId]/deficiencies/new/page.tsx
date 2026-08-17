import { DeficiencyFormPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyFormPage';

export default function MechanicalIntegrityNewImpairmentDeficiencyPage({ params }: { params: { impairmentId: string } }) {
  return <DeficiencyFormPage preset={{ sourceModule: 'Bypass / Impairment', sourceRecordId: params.impairmentId }} />;
}
