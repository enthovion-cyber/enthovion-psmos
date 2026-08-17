import { AuditScoreRunFormPage } from "@/features/audit/scoring/AuditScoreRunFormPage";
export default function Page({ params }: { params: { unitId: string } }) { return <AuditScoreRunFormPage sourceType="unit" sourceId={params.unitId} />; }
