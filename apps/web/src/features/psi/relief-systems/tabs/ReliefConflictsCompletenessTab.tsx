import type { ReliefSystemDetail } from '../../types/relief-system.types';
import { MiReliefDeviceSyncDiffPanel } from '../MiReliefDeviceSyncDiffPanel';
import { ReliefCompletenessPanel } from '../ReliefCompletenessPanel';
import { ReliefConflictPanel } from '../ReliefConflictPanel';

export function ReliefConflictsCompletenessTab({ detail }: { detail: ReliefSystemDetail }) {
  return (
    <div className="space-y-5">
      <ReliefCompletenessPanel rows={detail.completeness} />
      <ReliefConflictPanel rows={detail.conflicts} />
      <MiReliefDeviceSyncDiffPanel rows={detail.syncEvents} />
    </div>
  );
}
