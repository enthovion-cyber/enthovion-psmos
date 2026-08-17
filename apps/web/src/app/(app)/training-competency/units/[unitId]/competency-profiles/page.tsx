import { ProfileRegistryPage } from '@/features/training/competency/ProfileRegistryPage';
export default function Page({ params }: { params: { unitId: string } }) { return <ProfileRegistryPage initialFilter={{ unitId: params.unitId }} />; }
