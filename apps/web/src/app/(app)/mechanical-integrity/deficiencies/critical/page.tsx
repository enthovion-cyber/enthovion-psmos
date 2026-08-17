import { DeficiencyDashboardPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDashboardPage';

export default function MechanicalIntegrityCriticalDeficienciesPage() {
  return <DeficiencyDashboardPage initialFilters={{ critical: true }} />;
}
