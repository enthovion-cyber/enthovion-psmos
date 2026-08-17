import { ReadinessDashboardPage } from '@/features/mechanical-integrity/readiness/ReadinessDashboardPage';

export default function MechanicalIntegrityStartupBlockersPage() {
  return <ReadinessDashboardPage initialFilters={{ startupBlocked: 'true' }} />;
}
