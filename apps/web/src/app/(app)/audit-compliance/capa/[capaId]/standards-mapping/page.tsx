import { SourceAuditMappingsPage } from "@/features/audit/standards/SourceAuditMappingsPage";
export default function Page({ params }: { params: { capaId: string } }) { return <SourceAuditMappingsPage path={`capa/${params.capaId}`} title="CAPA Standards Mapping" />; }
