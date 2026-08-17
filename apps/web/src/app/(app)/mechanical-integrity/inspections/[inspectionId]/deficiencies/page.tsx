import { DeficiencyDashboardPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDashboardPage';

export default function MechanicalIntegrityInspectionDeficienciesPage({ params }: { params: { inspectionId: string } }) {
  return <DeficiencyDashboardPage initialFilters={{ sourceModule: 'Inspection', sourceRecordId: params.inspectionId }} />;
}
