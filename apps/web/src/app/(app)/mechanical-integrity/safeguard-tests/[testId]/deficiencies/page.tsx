import { DeficiencyDashboardPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDashboardPage';

export default function MechanicalIntegritySafeguardTestDeficienciesPage({ params }: { params: { testId: string } }) {
  return <DeficiencyDashboardPage initialFilters={{ sourceModule: 'Safeguard Test', sourceRecordId: params.testId }} />;
}
