import { SourceAuditMappingsPage } from "@/features/audit/standards/SourceAuditMappingsPage";
export default function Page({ params }: { params: { checklistId: string } }) { return <SourceAuditMappingsPage path={`checklists/templates/${params.checklistId}`} title="Checklist Standards Mapping" />; }
