import { SourceAuditMappingsPage } from "@/features/audit/standards/SourceAuditMappingsPage";
export default function Page({ params }: { params: { executionId: string } }) { return <SourceAuditMappingsPage path={`execution/${params.executionId}`} title="Execution Standards Mapping" />; }
