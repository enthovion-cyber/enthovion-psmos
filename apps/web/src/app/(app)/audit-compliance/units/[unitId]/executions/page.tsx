import { AuditExecutionRegisterPage } from "@/features/audit/execution/AuditExecutionRegisterPage";

export default function Page({ params }: { params: { unitId: string } }) {
  return <AuditExecutionRegisterPage preset={{ unit_id: params.unitId }} />;
}
