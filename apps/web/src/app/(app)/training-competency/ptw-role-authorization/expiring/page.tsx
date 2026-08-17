import { PtwAuthorizationRecordRegistryPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page() { return <PtwAuthorizationRecordRegistryPage title="Expiring PTW Authorizations" filters={{ expiring: 'true' }} />; }
