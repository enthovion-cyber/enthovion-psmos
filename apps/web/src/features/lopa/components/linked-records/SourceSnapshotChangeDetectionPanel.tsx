import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';

export function SourceSnapshotChangeDetectionPanel({ records }: { records: any[] }) {
  const changed = records.filter((record) => record.source_changed);
  return (
    <LopaPanel title="Source Snapshot / Change Detection">
      <div className="space-y-2">
        {changed.map((record) => <div key={record.id} className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-sm"><div className="flex justify-between"><b className="text-amber-100">{record.record_number ?? record.source_record_id}</b><TonePill tone="warning">Changed</TonePill></div><div className="mt-1 text-slate-300">{record.record_title ?? 'Source changed after snapshot. Sync or compare before review.'}</div></div>)}
        {!changed.length ? <div className="text-sm text-slate-400">All tracked source snapshots are current or no change metadata was returned.</div> : null}
      </div>
    </LopaPanel>
  );
}
