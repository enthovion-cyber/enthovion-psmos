import { DeviationDashboardPage } from '@/features/mechanical-integrity/deviations/DeviationDashboardPage';

export default function MechanicalIntegrityEquipmentDeviationsPage({ params }: { params: { id: string } }) {
  return <DeviationDashboardPage initialFilters={{ equipmentId: params.id }} />;
}
