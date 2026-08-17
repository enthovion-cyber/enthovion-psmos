import { DeficiencyFormPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyFormPage';

export default function MechanicalIntegrityNewPmDeficiencyPage({ params }: { params: { pmRecordId: string } }) {
  return <DeficiencyFormPage preset={{ sourceModule: 'Preventive Maintenance', sourceRecordId: params.pmRecordId }} />;
}
