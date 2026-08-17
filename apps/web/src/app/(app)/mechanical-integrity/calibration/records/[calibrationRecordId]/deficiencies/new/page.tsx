import { DeficiencyFormPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyFormPage';

export default function MechanicalIntegrityNewCalibrationDeficiencyPage({ params }: { params: { calibrationRecordId: string } }) {
  return <DeficiencyFormPage preset={{ sourceModule: 'Calibration', sourceRecordId: params.calibrationRecordId }} />;
}
