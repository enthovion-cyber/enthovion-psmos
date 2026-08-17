import { InspectionPlanRegistryPage } from '../../inspection-plans/InspectionPlanRegistryPage';

export function InspectionPlanTab({ equipmentId }: { equipmentId: string }) {
  return <InspectionPlanRegistryPage equipmentId={equipmentId} />;
}
