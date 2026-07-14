import { Clock } from 'lucide-react';
import type { GasTest } from '@/services/ptw.service';

export function GasRetestDueCard({ gasTest }: { gasTest?: GasTest }) {
  const due = gasTest?.next_test_due_at ? new Date(gasTest.next_test_due_at) : null;
  const overdue = due ? due.getTime() < Date.now() : false;
  return (
    <div className={`rounded-lg border p-3 ${overdue ? 'border-danger/30 bg-danger/10' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)]'}`}>
      <div className="flex items-center gap-2 text-sm font-semibold"><Clock size={16} /> Gas Retest</div>
      <div className={`mt-2 text-lg font-bold ${overdue ? 'text-danger' : 'text-warning'}`}>{due ? due.toLocaleString() : 'Not scheduled'}</div>
      <p className="mt-1 text-xs text-[var(--psm-muted)]">{overdue ? 'Permit must be suspended until retest passes.' : 'Retest schedule is active.'}</p>
    </div>
  );
}
