import { TrendingDown, TrendingUp } from 'lucide-react';
import type { GasReading } from '../../services/ptw-gas-test.service';

export function GasReadingCard({ reading, trend }: { reading?: GasReading | undefined; trend?: 'up' | 'down' | 'flat' | undefined }) {
  const pass = reading?.pass_fail !== 'Fail';
  return (
    <div className={`rounded-xl border p-4 ${pass ? 'border-success/20 bg-success/5' : 'border-danger/30 bg-danger/10'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{reading?.gas_name ?? reading?.gas_code ?? 'Gas'}</div>
          <div className="mt-2 text-2xl font-bold">{reading?.value ?? '-'} <span className="text-sm font-medium text-[var(--psm-muted)]">{reading?.unit ?? ''}</span></div>
        </div>
        <div className={`rounded-full px-2 py-1 text-xs font-semibold ${pass ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>{reading?.pass_fail ?? 'Not Recorded'}</div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[var(--psm-muted)]">
        <span>Allowed {formatLimit(reading)}</span>
        {trend === 'up' ? <span className="flex items-center gap-1 text-warning"><TrendingUp size={13} /> Rising</span> : null}
        {trend === 'down' ? <span className="flex items-center gap-1 text-success"><TrendingDown size={13} /> Falling</span> : null}
        {trend === 'flat' ? <span>Stable</span> : null}
      </div>
    </div>
  );
}

function formatLimit(reading?: GasReading) {
  if (!reading) return '-';
  const min = reading.min_limit ?? null;
  const max = reading.max_limit ?? null;
  if (min !== null && max !== null) return `${min}-${max}${reading.unit}`;
  if (max !== null) return `< ${max}${reading.unit}`;
  if (min !== null) return `> ${min}${reading.unit}`;
  return 'Site configured';
}
