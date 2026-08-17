import { PtwAuthorizationRecordRegistryPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page() { return <PtwAuthorizationRecordRegistryPage title="Suspended PTW Authorizations" filters={{ authorizationStatus: 'Suspended' }} />; }
