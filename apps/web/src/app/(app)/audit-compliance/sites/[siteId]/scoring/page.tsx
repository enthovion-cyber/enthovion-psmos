import { AuditScoreRunFormPage } from "@/features/audit/scoring/AuditScoreRunFormPage";
export default function Page({ params }: { params: { siteId: string } }) { return <AuditScoreRunFormPage sourceType="site" sourceId={params.siteId} />; }
