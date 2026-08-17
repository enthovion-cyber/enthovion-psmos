import { SourceAuditMappingsPage } from "@/features/audit/standards/SourceAuditMappingsPage";
export default function Page({ params }: { params: { unitId: string } }) { return <SourceAuditMappingsPage path={`units/${params.unitId}`} title="Unit Standards Mapping" />; }
