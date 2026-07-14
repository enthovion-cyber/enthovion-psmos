import type { HazopReviewReadiness } from '../../types/hazop-review.types';
import { Button } from './HazopApprovalWorkflowPanel';
import { Panel } from './HazopReadinessChecklist';

export function HazopFinalApprovalPanel({ readiness, status, canClose, canReopen, loading, onClose, onReopen }: { readiness?: HazopReviewReadiness; status?: string; canClose?: boolean; canReopen?: boolean; loading?: boolean; onClose: () => void; onReopen: () => void }) {
  const isClosed = status === 'Closed';
  return (
    <Panel title="Final Approval / Close Study">
      <div className={`rounded-xl border p-4 ${readiness?.ready ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-red-400/30 bg-red-500/10'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{readiness?.status ?? 'Not calculated'}</div>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">{readiness?.ready ? 'Readiness passes. Required approvers can complete final approval and close the study.' : 'Hard blockers must be cleared before approval or closure.'}</p>
          </div>
          <div className="grid size-20 place-items-center rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)]">
            <span className="text-xl font-semibold">{readiness?.progress ?? 0}%</span>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <Row label="Open recommendations" value={readiness?.recommendationsOpen ?? 0} />
        <Row label="Open actions" value={readiness?.actionsOpen ?? 0} />
        <Row label="Pending sign-offs" value={readiness?.signoffsPending ?? 0} />
        <Row label="Linked blockers" value={readiness?.linkedBlockers ?? 0} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {canClose ? <Button disabled={!readiness?.ready || loading || isClosed} onClick={onClose}>{loading ? 'Closing...' : 'Close Study'}</Button> : null}
        {canReopen ? <Button disabled={loading || !isClosed} onClick={onReopen}>Reopen Study</Button> : null}
      </div>
    </Panel>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><span className="text-[var(--psm-muted)]">{label}</span><span className={value ? 'font-semibold text-amber-300' : 'font-semibold text-emerald-300'}>{value}</span></div>;
}
