import { ProfileDetailPage } from '@/features/training/competency/ProfileDetailPage';
export default function Page({ params }: { params: { profileId: string } }) { return <ProfileDetailPage profileId={params.profileId} tab="evaluations" />; }
