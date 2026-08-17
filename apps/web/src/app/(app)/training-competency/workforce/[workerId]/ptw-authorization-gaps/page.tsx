import { PtwAuthorizationWorkerPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page({ params }: { params: { workerId: string } }) { return <PtwAuthorizationWorkerPage workerId={params.workerId} view="gaps" />; }
