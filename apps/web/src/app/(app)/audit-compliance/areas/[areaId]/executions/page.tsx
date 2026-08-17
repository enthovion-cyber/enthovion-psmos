import { AuditExecutionRegisterPage } from "@/features/audit/execution/AuditExecutionRegisterPage";

export default function Page({ params }: { params: { areaId: string } }) {
  return <AuditExecutionRegisterPage preset={{ area_id: params.areaId }} />;
}
