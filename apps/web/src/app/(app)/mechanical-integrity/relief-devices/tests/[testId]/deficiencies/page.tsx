import { DeficiencyDashboardPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDashboardPage';

export default function MechanicalIntegrityReliefTestDeficienciesPage({ params }: { params: { testId: string } }) {
  return <DeficiencyDashboardPage initialFilters={{ sourceModule: 'Relief Device Test', sourceRecordId: params.testId }} />;
}
