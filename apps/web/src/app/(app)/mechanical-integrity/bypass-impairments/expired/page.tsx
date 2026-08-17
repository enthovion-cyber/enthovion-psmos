import { ImpairmentDashboardPage } from '@/features/mechanical-integrity/impairments/ImpairmentDashboardPage';

export default function ExpiredBypassImpairmentsPage() {
  return <ImpairmentDashboardPage initialFilters={{ status: 'Expired' }} />;
}
