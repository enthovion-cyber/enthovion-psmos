import { PreventiveMaintenanceTab } from '@/features/mechanical-integrity/equipment-detail/tabs/PreventiveMaintenanceTab';

export default function EquipmentPreventiveMaintenancePage({ params }: { params: { id: string } }) {
  return <PreventiveMaintenanceTab equipmentId={params.id} />;
}

