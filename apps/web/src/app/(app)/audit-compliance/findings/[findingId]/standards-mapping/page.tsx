import { SourceAuditMappingsPage } from "@/features/audit/standards/SourceAuditMappingsPage";
export default function Page({ params }: { params: { findingId: string } }) { return <SourceAuditMappingsPage path={`findings/${params.findingId}`} title="Finding Standards Mapping" />; }
