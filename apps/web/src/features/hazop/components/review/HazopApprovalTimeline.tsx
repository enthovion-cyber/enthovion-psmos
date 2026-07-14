import type { HazopApprovalWorkflow } from '../../types/hazop-review.types';
import { Panel } from './HazopReadinessChecklist';

export function HazopApprovalTimeline({ workflow }: { workflow?: HazopApprovalWorkflow }) {
  const items = [
    ['Review started', workflow?.started_at],
    ['Approval requested', workflow?.requested_at],
    ['Approved', workflow?.approved_at],
    ['Rejected', workflow?.rejected_at],
    ['Returned for rework', workflow?.returned_at],
    ['Closed', workflow?.closed_at],
    ['Reopened', workflow?.reopened_at]
  ].filter(([, date]) => date);
  return (
    <Panel title="Approval Timeline">
      {items.map(([label, date], index) => (
        <div key={label} className="relative border-l border-emerald-400/40 pb-4 pl-5 text-sm last:pb-0">
          <span className="absolute -left-1.5 top-1 size-3 rounded-full border border-emerald-300 bg-[var(--psm-surface)]" />
          <div className="font-semibold">{index + 1}. {label}</div>
          <div className="text-[var(--psm-muted)]">{date ? new Date(String(date)).toLocaleString() : '-'}</div>
        </div>
      ))}
      {!items.length ? <p className="text-sm text-[var(--psm-muted)]">Workflow timeline has not started.</p> : null}
    </Panel>
  );
}
