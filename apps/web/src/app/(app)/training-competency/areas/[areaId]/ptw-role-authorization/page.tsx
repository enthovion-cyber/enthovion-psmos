import { PtwAuthorizationScopedPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page({ params }: { params: { areaId: string } }) { return <PtwAuthorizationScopedPage scope="areas" id={params.areaId} />; }
