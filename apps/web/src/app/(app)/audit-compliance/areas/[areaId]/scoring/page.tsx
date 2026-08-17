import { AuditScoreRunFormPage } from "@/features/audit/scoring/AuditScoreRunFormPage";
export default function Page({ params }: { params: { areaId: string } }) { return <AuditScoreRunFormPage sourceType="area" sourceId={params.areaId} />; }
