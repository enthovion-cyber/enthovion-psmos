import { ReviewCard, EmptyPanel } from './ReviewApprovalPrimitives';

export function ChangeSummaryPanel({ snapshots }: { snapshots?: Array<Record<string, unknown>> }) {
  return (
    <ReviewCard title="Change Summary / Snapshot" description="Immutable before/after package used to detect stale approvals.">
      {!snapshots?.length ? <EmptyPanel>No change snapshots are available.</EmptyPanel> : (
        <div className="space-y-3">
          {snapshots.map((snapshot) => (
            <details key={String(snapshot.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
              <summary className="cursor-pointer font-semibold">Snapshot {String(snapshot.snapshot_type ?? snapshot.created_at ?? snapshot.id)}</summary>
              <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-black/20 p-3 text-xs">{JSON.stringify(snapshot.after_snapshot_json ?? snapshot, null, 2)}</pre>
            </details>
          ))}
        </div>
      )}
    </ReviewCard>
  );
}
