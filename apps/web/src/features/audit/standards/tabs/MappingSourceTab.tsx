import { AuditCard } from "../../shared/AuditUi";
export function MappingSourceTab({ detail }: { detail: Record<string, any> }) {
  return <AuditCard title="Source snapshot" subtitle="Saved snapshot is preserved; future source changes require stale review."><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(detail.mapping.source_snapshot_json ?? {}, null, 2)}</pre></AuditCard>;
}
