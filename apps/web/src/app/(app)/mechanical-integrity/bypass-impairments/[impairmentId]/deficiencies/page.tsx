import { DeficiencyDashboardPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDashboardPage';

export default function MechanicalIntegrityImpairmentDeficienciesPage({ params }: { params: { impairmentId: string } }) {
  return <DeficiencyDashboardPage initialFilters={{ sourceModule: 'Bypass / Impairment', sourceRecordId: params.impairmentId }} />;
}
