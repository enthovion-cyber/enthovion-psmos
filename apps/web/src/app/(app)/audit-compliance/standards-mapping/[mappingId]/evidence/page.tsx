import { AuditMappingDetailPage } from "@/features/audit/standards/AuditMappingDetailPage";
export default function Page({ params }: { params: { mappingId: string } }) { return <AuditMappingDetailPage mappingId={params.mappingId} tab="evidence" />; }
