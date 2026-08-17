import { ImpairmentDashboardPage } from '../../impairments/ImpairmentDashboardPage';

export function ImpairmentsTab({ equipmentId }: { equipmentId: string }) {
  return <ImpairmentDashboardPage initialFilters={{ equipmentId }} />;
}
