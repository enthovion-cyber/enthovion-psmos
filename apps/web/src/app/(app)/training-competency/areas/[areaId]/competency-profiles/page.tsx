import { ProfileRegistryPage } from '@/features/training/competency/ProfileRegistryPage';
export default function Page({ params }: { params: { areaId: string } }) { return <ProfileRegistryPage initialFilter={{ areaId: params.areaId }} />; }
