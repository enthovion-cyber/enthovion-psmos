import { AuditExecutionRegisterPage } from "@/features/audit/execution/AuditExecutionRegisterPage";

export default function Page() {
  return <AuditExecutionRegisterPage preset={{ criticality: "Regulatory-Critical" }} />;
}
