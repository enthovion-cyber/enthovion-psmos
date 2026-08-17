import { DeficiencyFormPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyFormPage';

export default function MechanicalIntegrityNewInspectionDeficiencyPage({ params }: { params: { inspectionId: string } }) {
  return <DeficiencyFormPage preset={{ sourceModule: 'Inspection', sourceRecordId: params.inspectionId }} />;
}
