import { AuditMappingFormPage } from "@/features/audit/standards/AuditMappingFormPage";
export default function Page({ params }: { params: { mappingId: string } }) { return <AuditMappingFormPage mappingId={params.mappingId} />; }
