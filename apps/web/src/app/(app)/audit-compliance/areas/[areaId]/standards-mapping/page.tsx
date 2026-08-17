import { SourceAuditMappingsPage } from "@/features/audit/standards/SourceAuditMappingsPage";
export default function Page({ params }: { params: { areaId: string } }) { return <SourceAuditMappingsPage path={`areas/${params.areaId}`} title="Area Standards Mapping" />; }
