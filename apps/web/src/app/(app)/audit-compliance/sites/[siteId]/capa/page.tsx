import { AuditCapaRegisterPage } from "@/features/audit/capa/AuditCapaRegisterPage";

export default function Page({ params }: { params: { siteId: string } }) {
  return <AuditCapaRegisterPage preset={{ siteId: params.siteId }} />;
}
