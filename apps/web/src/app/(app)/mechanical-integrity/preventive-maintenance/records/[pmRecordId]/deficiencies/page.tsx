import { DeficiencyDashboardPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDashboardPage';

export default function MechanicalIntegrityPmRecordDeficienciesPage({ params }: { params: { pmRecordId: string } }) {
  return <DeficiencyDashboardPage initialFilters={{ sourceModule: 'Preventive Maintenance', sourceRecordId: params.pmRecordId }} />;
}
