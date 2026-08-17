import { AuditEmptyState } from "../../shared/AuditUi";
import { MiniTable } from "../shared";
export function MappingLinkedRecordsTab({ detail }: { detail: Record<string, any> }) {
  return <MiniTable rows={detail.links ?? []} empty={<AuditEmptyState title="No linked records" message="Link checklist items, evidence, findings, CAPA, score runs, or source module records to complete traceability." />} columns={[{ key: "linked_object_type", label: "Type" }, { key: "linked_module", label: "Module" }, { key: "linked_record_id", label: "Record ID" }, { key: "link_role", label: "Role" }, { key: "link_status", label: "Status" }, { key: "linked_at", label: "Linked at" }]} />;
}
