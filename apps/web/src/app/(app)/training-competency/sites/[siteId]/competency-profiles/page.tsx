import { ProfileRegistryPage } from '@/features/training/competency/ProfileRegistryPage';
export default function Page({ params }: { params: { siteId: string } }) { return <ProfileRegistryPage initialFilter={{ siteId: params.siteId }} />; }
