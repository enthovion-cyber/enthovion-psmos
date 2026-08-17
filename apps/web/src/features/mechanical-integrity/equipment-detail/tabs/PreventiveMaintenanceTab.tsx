import { PmPlanRegistryPage } from '../../preventive-maintenance/PmPlanRegistryPage';

export function PreventiveMaintenanceTab({ equipmentId }: { equipmentId: string }) {
  return <PmPlanRegistryPage equipmentId={equipmentId} />;
}

