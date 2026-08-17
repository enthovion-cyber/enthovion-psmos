import { DeficiencyDashboardPage } from '@/features/mechanical-integrity/deficiencies/DeficiencyDashboardPage';

export default function MechanicalIntegrityDeficiencyImportPage() {
  return <DeficiencyDashboardPage initialFilters={{ importMode: true }} />;
}
