import { PtwAuthorizationGapPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page() { return <PtwAuthorizationGapPage title="Blocked Workers" filters={{ gapStatus: 'Open' }} />; }
