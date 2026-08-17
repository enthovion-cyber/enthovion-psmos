import { ReliefTestResultBadge } from '../../shared/ReliefTestResultBadge';
import { DetailPanel } from './detail-utils';

export function ReliefDeviceTestRecordsTab({ rows }: { rows?: Array<Record<string, any>> | undefined }) {
  return (
    <DetailPanel title="PSV Test Records">
      <div className="space-y-2">
        {(rows ?? []).map((row) => <div key={row.id} className="flex items-center justify-between rounded-lg bg-[var(--psm-surface-2)] p-3 text-sm"><span>{row.test_record_number ?? row.testRecordNumber}</span><ReliefTestResultBadge result={row.final_result ?? row.finalResult} /></div>)}
        {!rows?.length ? <p className="text-sm text-[var(--psm-muted)]">No relief test records yet.</p> : null}
      </div>
    </DetailPanel>
  );
}
