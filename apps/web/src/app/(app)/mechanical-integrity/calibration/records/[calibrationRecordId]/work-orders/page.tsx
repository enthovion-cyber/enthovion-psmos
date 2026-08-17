import { WorkOrderDashboardPage } from '@/features/mechanical-integrity/work-orders/WorkOrderDashboardPage';

export default function MechanicalIntegrityCalibrationWorkOrdersPage({ params }: { params: { calibrationRecordId: string } }) {
  return <WorkOrderDashboardPage initialFilters={{ sourceModule: 'Calibration', sourceRecordId: params.calibrationRecordId }} />;
}
