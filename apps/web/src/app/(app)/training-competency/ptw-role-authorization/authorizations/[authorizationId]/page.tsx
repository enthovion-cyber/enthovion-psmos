import { PtwAuthorizationDetailPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page({ params }: { params: { authorizationId: string } }) { return <PtwAuthorizationDetailPage id={params.authorizationId} kind="authorization" />; }
