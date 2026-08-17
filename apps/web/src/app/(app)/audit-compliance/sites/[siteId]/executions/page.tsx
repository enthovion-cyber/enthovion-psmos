import { AuditExecutionRegisterPage } from "@/features/audit/execution/AuditExecutionRegisterPage";

export default function Page({ params }: { params: { siteId: string } }) {
  return <AuditExecutionRegisterPage preset={{ siteId: params.siteId }} />;
}
