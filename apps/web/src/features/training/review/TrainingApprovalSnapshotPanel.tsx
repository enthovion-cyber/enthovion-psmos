import { TrainingCard } from '../shared/TrainingUi';
export function TrainingApprovalSnapshotPanel({ data }: { data?: any }) {
  return <TrainingCard title="Snapshot" subtitle="Source state captured immutably at submission time."><pre className="max-h-80 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(data?.request?.source_snapshot_json ?? {}, null, 2)}</pre></TrainingCard>;
}
