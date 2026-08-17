import { PtwAuthorizationScopedPage } from '@/features/training/ptw-authorization/PtwAuthorizationDashboardPage';
export default function Page({ params }: { params: { siteId: string } }) { return <PtwAuthorizationScopedPage scope="sites" id={params.siteId} />; }
