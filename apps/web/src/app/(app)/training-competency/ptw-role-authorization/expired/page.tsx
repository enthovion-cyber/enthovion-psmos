import { PtwAuthorizationRecordRegistryPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page() { return <PtwAuthorizationRecordRegistryPage title="Expired PTW Authorizations" filters={{ authorizationStatus: 'Expired' }} />; }
