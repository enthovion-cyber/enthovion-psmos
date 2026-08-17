import type { ReliefDevice } from '../types/relief-device.types';
import { ReliefDueStatusBadge } from '../shared/ReliefDueStatusBadge';

export function ReliefDeviceMobileCards({ rows }: { rows?: ReliefDevice[] }) {
  if (!rows?.length) return null;
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{row.deviceTag ?? row.device_tag}</p>
              <p className="text-xs text-[var(--psm-muted)]">{row.deviceType ?? row.device_type} - {row.serviceFluid ?? row.service_fluid ?? 'No service fluid'}</p>
            </div>
            <ReliefDueStatusBadge status={row.dueStatus ?? row.due_status} />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div><dt className="text-[var(--psm-muted)]">Next due</dt><dd>{row.nextTestDueDate ?? row.next_test_due_date ?? 'Not scheduled'}</dd></div>
            <div><dt className="text-[var(--psm-muted)]">Last result</dt><dd>{row.lastTestResult ?? row.last_test_result ?? 'None'}</dd></div>
          </dl>
        </div>
      ))}
    </div>
  );
}
