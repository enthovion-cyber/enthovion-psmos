import { ReadinessBlockerBadge } from '../shared/ReadinessBlockerBadge';
import { ActionButton, cardValue } from '../safeguards/SafeguardUiPrimitives';
import type { MiReadinessBlocker } from '../types/readiness.types';

export function BlockerList({ blockers, onClear, onWaive, onCreateAction }: { blockers?: MiReadinessBlocker[] | undefined; onClear?: ((id: string) => void) | undefined; onWaive?: ((id: string) => void) | undefined; onCreateAction?: ((item: MiReadinessBlocker) => void) | undefined }) {
  if (!blockers?.length) return <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-5 text-sm text-[var(--psm-muted)]">No readiness blockers returned by the backend engine.</div>;
  return (
    <div className="space-y-3">
      {blockers.map((item) => (
        <article key={item.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <ReadinessBlockerBadge severity={item.severity} />
                <span className="rounded-full border border-[var(--psm-line)] px-2.5 py-1 text-xs font-semibold">{cardValue(item.source_module)}</span>
                <span className="rounded-full border border-[var(--psm-line)] px-2.5 py-1 text-xs font-semibold">{cardValue(item.blocker_status)}</span>
              </div>
              <h3 className="mt-3 font-semibold">{cardValue(item.blocker_title)}</h3>
              <p className="mt-1 text-sm text-[var(--psm-muted)]">{cardValue(item.blocker_description ?? item.recommended_action)}</p>
              <p className="mt-2 text-xs text-[var(--psm-muted)]">Due: {cardValue(item.due_date, 'None')} | Owner: {cardValue(item.owner_user_id, 'Unassigned')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={() => onClear?.(item.id)} disabled={item.blocker_status === 'Cleared'} title="Already cleared">Clear</ActionButton>
              <ActionButton onClick={() => onWaive?.(item.id)} disabled={item.blocker_status === 'Waived With Approval'} title="Already waived">Waive</ActionButton>
              {onCreateAction ? <ActionButton onClick={() => onCreateAction(item)} disabled={item.blocker_status === 'Action Assigned'} title="Action already assigned">Create Action</ActionButton> : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
