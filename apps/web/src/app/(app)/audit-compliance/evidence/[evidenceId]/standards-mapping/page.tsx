import { SourceAuditMappingsPage } from "@/features/audit/standards/SourceAuditMappingsPage";
export default function Page({ params }: { params: { evidenceId: string } }) { return <SourceAuditMappingsPage path={`evidence/${params.evidenceId}`} title="Evidence Standards Mapping" />; }
