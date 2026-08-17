import { ReadinessDashboardPage } from '@/features/mechanical-integrity/readiness/ReadinessDashboardPage';

export default function MechanicalIntegrityFitWithRestrictionsPage() {
  return <ReadinessDashboardPage initialFilters={{ decision: 'Fit for Service with Restrictions' }} />;
}
