import { PtwAuthorizationRecordRegistryPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page() { return <PtwAuthorizationRecordRegistryPage title="PTW Authorizations Pending Approval" filters={{ approvalStatus: 'Pending Approval' }} />; }
