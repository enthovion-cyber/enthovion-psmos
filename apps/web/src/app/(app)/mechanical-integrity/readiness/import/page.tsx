import { ReadinessDashboardPage } from '@/features/mechanical-integrity/readiness/ReadinessDashboardPage';

export default function MechanicalIntegrityReadinessImportPage() {
  return <ReadinessDashboardPage initialFilters={{ importMode: 'true' }} />;
}
