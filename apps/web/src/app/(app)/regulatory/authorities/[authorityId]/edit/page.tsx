import { RegulatoryAuthorityDetailPage } from '@/features/regulatory/authorities/RegulatoryAuthorityDetailPage';
export default function Page({ params }: { params: { authorityId: string } }) { return <RegulatoryAuthorityDetailPage authorityId={params.authorityId} edit />; }
