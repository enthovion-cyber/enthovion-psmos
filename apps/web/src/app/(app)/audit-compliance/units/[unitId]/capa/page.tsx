import { AuditCapaRegisterPage } from "@/features/audit/capa/AuditCapaRegisterPage";

export default function Page({ params }: { params: { unitId: string } }) {
  return <AuditCapaRegisterPage preset={{ unitId: params.unitId }} />;
}
