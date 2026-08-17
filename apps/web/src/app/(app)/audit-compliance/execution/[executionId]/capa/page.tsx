import { AuditCapaRegisterPage } from "@/features/audit/capa/AuditCapaRegisterPage";

export default function Page({ params }: { params: { executionId: string } }) {
  return <AuditCapaRegisterPage preset={{ executionId: params.executionId }} />;
}
