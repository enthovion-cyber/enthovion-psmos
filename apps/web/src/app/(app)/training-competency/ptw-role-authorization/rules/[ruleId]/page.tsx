import { PtwAuthorizationDetailPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page({ params }: { params: { ruleId: string } }) { return <PtwAuthorizationDetailPage id={params.ruleId} kind="rule" />; }
