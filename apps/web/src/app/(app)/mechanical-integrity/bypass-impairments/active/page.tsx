import { ImpairmentDashboardPage } from '@/features/mechanical-integrity/impairments/ImpairmentDashboardPage';

export default function ActiveBypassImpairmentsPage() {
  return <ImpairmentDashboardPage initialFilters={{ statusGroup: 'active' }} />;
}
