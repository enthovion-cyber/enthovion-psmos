import { AuditCapaRegisterPage } from "@/features/audit/capa/AuditCapaRegisterPage";

export default function Page({ params }: { params: { areaId: string } }) {
  return <AuditCapaRegisterPage preset={{ areaId: params.areaId }} />;
}
