import { AuditEmptyState } from "../../shared/AuditUi";
import { MiniTable } from "../shared";
export function MappingHistoryTab({ detail }: { detail: Record<string, any> }) {
  return <MiniTable rows={detail.history ?? []} empty={<AuditEmptyState title="No mapping history" message="History events appear after create, update, link, unlink, verify, override, stale, recalculate, and snapshot actions." />} columns={[{ key: "event_title", label: "Event" }, { key: "event_description", label: "Description" }, { key: "actor_user_id", label: "Actor" }, { key: "created_at", label: "Created" }]} />;
}
