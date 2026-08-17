import { AuditCapaRegisterPage } from "@/features/audit/capa/AuditCapaRegisterPage";

export default function Page({ params }: { params: { programId: string } }) {
  return <AuditCapaRegisterPage preset={{ programId: params.programId }} />;
}
