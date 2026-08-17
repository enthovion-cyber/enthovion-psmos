import { SourceAuditMappingsPage } from "@/features/audit/standards/SourceAuditMappingsPage";
export default function Page({ params }: { params: { planId: string } }) { return <SourceAuditMappingsPage path={`plans/${params.planId}`} title="Plan Standards Mapping" />; }
