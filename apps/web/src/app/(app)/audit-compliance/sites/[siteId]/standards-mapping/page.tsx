import { SourceAuditMappingsPage } from "@/features/audit/standards/SourceAuditMappingsPage";
export default function Page({ params }: { params: { siteId: string } }) { return <SourceAuditMappingsPage path={`sites/${params.siteId}`} title="Site Standards Mapping" />; }
