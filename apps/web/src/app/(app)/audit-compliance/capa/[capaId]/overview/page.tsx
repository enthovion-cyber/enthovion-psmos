import { AuditCapaDetailPage } from "@/features/audit/capa/AuditCapaDetailPage";

export default function Page({ params }: { params: { capaId: string } }) {
  return <AuditCapaDetailPage capaId={params.capaId} activeTab="overview" />;
}
