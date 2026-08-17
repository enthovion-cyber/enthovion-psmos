import { DeficiencyDashboardPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDashboardPage';

export default function MechanicalIntegrityPendingApprovalDeficienciesPage() {
  return <DeficiencyDashboardPage initialFilters={{ status: 'Under Review' }} />;
}
