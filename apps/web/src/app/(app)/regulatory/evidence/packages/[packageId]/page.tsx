import { RegulatoryEvidencePackagePage } from '@/features/regulatory/evidence/RegulatoryEvidencePackagePage';
export default function Page({ params }: { params: { packageId: string } }) { return <RegulatoryEvidencePackagePage mode="detail" packageId={params.packageId} />; }
