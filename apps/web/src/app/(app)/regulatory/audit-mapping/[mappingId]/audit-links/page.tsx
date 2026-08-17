import { RegulatoryAuditMappingDetailPage } from '@/features/regulatory/audit-mapping/RegulatoryAuditMappingDetailPage';
export default function Page({ params }: { params: { mappingId: string } }) { return <RegulatoryAuditMappingDetailPage mappingId={params.mappingId} tab="audit-links" />; }
