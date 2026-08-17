import { MiActionsPage } from '@/features/mechanical-integrity/actions/MiActionsPage';

export default function MechanicalIntegrityEquipmentActionsPage({ params }: { params: { id: string } }) {
  return <MiActionsPage initialFilters={{ equipmentId: params.id }} />;
}
