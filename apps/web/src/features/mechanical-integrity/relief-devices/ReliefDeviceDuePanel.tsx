import type { ReliefDevice } from '../types/relief-device.types';
import { ReliefDueStatusBadge } from '../shared/ReliefDueStatusBadge';

export function ReliefDeviceDuePanel({ rows }: { rows?: ReliefDevice[] }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-semibold">Due / overdue engine</h2>
      <div className="mt-3 space-y-2">
        {(rows ?? []).slice(0, 8).map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg bg-[var(--psm-surface-2)] p-3 text-sm">
            <span>{row.deviceTag ?? row.device_tag}</span>
            <ReliefDueStatusBadge status={row.dueStatus ?? row.due_status} />
          </div>
        ))}
        {!rows?.length ? <p className="text-sm text-[var(--psm-muted)]">No due or overdue relief device tests.</p> : null}
      </div>
    </section>
  );
}
