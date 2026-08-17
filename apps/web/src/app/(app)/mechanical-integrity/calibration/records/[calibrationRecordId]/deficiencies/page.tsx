import { DeficiencyDashboardPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDashboardPage';

export default function MechanicalIntegrityCalibrationDeficienciesPage({ params }: { params: { calibrationRecordId: string } }) {
  return <DeficiencyDashboardPage initialFilters={{ sourceModule: 'Calibration', sourceRecordId: params.calibrationRecordId }} />;
}
