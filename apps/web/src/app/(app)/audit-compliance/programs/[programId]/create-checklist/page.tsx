import { AuditChecklistFormPage } from "@/features/audit/checklists/AuditChecklistFormPage";

export default function Page({ params }: { params: { programId: string } }) {
  return <AuditChecklistFormPage defaults={{ programId: params.programId }} />;
}
