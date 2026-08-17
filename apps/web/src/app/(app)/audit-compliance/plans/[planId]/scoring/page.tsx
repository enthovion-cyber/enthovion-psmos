import { AuditScoreRunFormPage } from "@/features/audit/scoring/AuditScoreRunFormPage";
export default function Page({ params }: { params: { planId: string } }) { return <AuditScoreRunFormPage sourceType="plan" sourceId={params.planId} />; }
