import { DeficiencyDashboardPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDashboardPage';

export default function MechanicalIntegrityOpenDeficienciesPage() {
  return <DeficiencyDashboardPage initialFilters={{ closed: false }} />;
}
