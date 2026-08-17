import { AuditExecutionRegisterPage } from "@/features/audit/execution/AuditExecutionRegisterPage";

export default function Page({ params }: { params: { checklistId: string } }) {
  return <AuditExecutionRegisterPage preset={{ checklistId: params.checklistId }} />;
}
