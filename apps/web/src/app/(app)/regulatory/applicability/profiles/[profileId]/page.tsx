import { RegulatoryApplicabilityProfileDetailPage } from '@/features/regulatory/applicability/RegulatoryApplicabilityProfileDetailPage';
export default function Page({ params }: { params: { profileId: string } }) { return <RegulatoryApplicabilityProfileDetailPage profileId={params.profileId} />; }
