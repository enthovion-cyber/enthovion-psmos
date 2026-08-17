import { AuditCapaRegisterPage } from "@/features/audit/capa/AuditCapaRegisterPage";

export default function Page({ params }: { params: { findingId: string } }) {
  return <AuditCapaRegisterPage preset={{ findingId: params.findingId }} />;
}
