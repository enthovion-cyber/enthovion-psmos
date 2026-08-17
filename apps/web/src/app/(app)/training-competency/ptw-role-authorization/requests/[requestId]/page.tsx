import { PtwAuthorizationDetailPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page({ params }: { params: { requestId: string } }) { return <PtwAuthorizationDetailPage id={params.requestId} kind="request" />; }
