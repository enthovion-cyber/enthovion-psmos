import { DeficiencyDashboardPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDashboardPage';

export default function MechanicalIntegrityEquipmentDeficienciesPage({ params }: { params: { id: string } }) {
  return <DeficiencyDashboardPage initialFilters={{ equipmentId: params.id }} />;
}
