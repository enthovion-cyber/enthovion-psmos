import { ImpairmentDashboardPage } from '@/features/mechanical-integrity/impairments/ImpairmentDashboardPage';

export default function EquipmentImpairmentsPage({ params }: { params: { id: string } }) {
  return <ImpairmentDashboardPage initialFilters={{ equipmentId: params.id }} />;
}
