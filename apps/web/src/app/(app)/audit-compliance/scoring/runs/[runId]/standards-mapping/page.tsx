import { SourceAuditMappingsPage } from "@/features/audit/standards/SourceAuditMappingsPage";
export default function Page({ params }: { params: { runId: string } }) { return <SourceAuditMappingsPage path={`scoring/runs/${params.runId}`} title="Score Run Standards Mapping" />; }
