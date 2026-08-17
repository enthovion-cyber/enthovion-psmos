import { AuditCapaFormPage } from "@/features/audit/capa/AuditCapaFormPage";

export default function Page({ params }: { params: { capaId: string } }) {
  return <AuditCapaFormPage capaId={params.capaId} />;
}
