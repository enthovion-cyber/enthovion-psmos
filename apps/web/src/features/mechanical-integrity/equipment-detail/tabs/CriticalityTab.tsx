import { EquipmentCriticalityPage } from '../../criticality/equipment/EquipmentCriticalityPage';

export function CriticalityTab({ equipmentId }: { equipmentId: string }) {
  return <EquipmentCriticalityPage equipmentId={equipmentId} />;
}
