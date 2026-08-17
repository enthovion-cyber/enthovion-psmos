import { RegulatoryEvidenceLinkDetailPage } from '@/features/regulatory/evidence/RegulatoryEvidenceLinkDetailPage';
export default function Page({ params }: { params: { evidenceLinkId: string } }) { return <RegulatoryEvidenceLinkDetailPage evidenceLinkId={params.evidenceLinkId} tab="overview" />; }
