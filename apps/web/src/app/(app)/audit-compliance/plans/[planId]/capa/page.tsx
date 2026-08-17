import { AuditCapaRegisterPage } from "@/features/audit/capa/AuditCapaRegisterPage";

export default function Page({ params }: { params: { planId: string } }) {
  return <AuditCapaRegisterPage preset={{ planId: params.planId }} />;
}
