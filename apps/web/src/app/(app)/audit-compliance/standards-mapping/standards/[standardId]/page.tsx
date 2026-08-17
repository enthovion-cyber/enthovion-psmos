import { AuditStandardFormPage } from "@/features/audit/standards/AuditStandardFormPage";
export default function Page({ params }: { params: { standardId: string } }) { return <AuditStandardFormPage standardId={params.standardId} />; }
