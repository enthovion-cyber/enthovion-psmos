import { PtwAuthorizationScopedPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page({ params }: { params: { unitId: string } }) { return <PtwAuthorizationScopedPage scope="units" id={params.unitId} />; }
