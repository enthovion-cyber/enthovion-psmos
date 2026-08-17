import { AuditFindingScopedRegisterPage } from "@/features/audit/findings/AuditFindingScopedRegisterPage";
export default function Page({ params }: { params: { areaId: string } }) { return <AuditFindingScopedRegisterPage preset={{ areaId: params.areaId }} />; }
