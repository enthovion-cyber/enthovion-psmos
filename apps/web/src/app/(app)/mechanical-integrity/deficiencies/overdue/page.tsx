import { DeficiencyDashboardPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDashboardPage';

export default function MechanicalIntegrityOverdueDeficienciesPage() {
  return <DeficiencyDashboardPage initialFilters={{ overdue: true }} />;
}
