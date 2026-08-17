import { ReadinessDashboardPage } from '@/features/mechanical-integrity/readiness/ReadinessDashboardPage';

export default function MechanicalIntegrityNotFitPage() {
  return <ReadinessDashboardPage initialFilters={{ decision: 'Not Fit for Service' }} />;
}
