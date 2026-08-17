import { ProfileFormPage } from '@/features/training/competency/ProfileFormPage';
export default function Page({ params }: { params: { profileId: string } }) { return <ProfileFormPage profileId={params.profileId} />; }
