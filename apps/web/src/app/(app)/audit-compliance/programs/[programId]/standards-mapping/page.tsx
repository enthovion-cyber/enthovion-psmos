import { SourceAuditMappingsPage } from "@/features/audit/standards/SourceAuditMappingsPage";
export default function Page({ params }: { params: { programId: string } }) { return <SourceAuditMappingsPage path={`programs/${params.programId}`} title="Program Standards Mapping" />; }
