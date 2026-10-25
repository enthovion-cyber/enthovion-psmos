import type { Permit } from '@/services/ptw.service';
import { PermitStatusBadge, PermitTypeBadge, RiskBadge } from '../PermitBadges';
import { timeLeft, formatClock } from './dashboard-ui';

export function PermitListItem({
  permit,
  selected,
  onSelect
}: {
  permit: Permit;
  selected: boolean;
  onSelect: () => void;
}) {
  const open = () => {
    window.location.href = `/ptw/${permit.id}`;
  };
  const latestGas = permit.gasTests?.[0];
  const openConflicts = permit.conflicts?.filter((item) => item.status === 'Open').length ?? 0;
  const isolationPending = permit.isolations?.some((item) => !['Confirmed', 'Verified', 'Fully Isolated'].includes(item.isolation_status ?? item.status));
  const handoverPending = permit.handovers?.some((item) => !item.acknowledged_at);

  return (
    <button
      className={`block w-full px-2.5 py-2 text-left transition rounded-md ${
        selected
          ? 'bg-orange-50/90 dark:bg-cyan-950/40 ring-1 ring-primary/40'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
      }`}
      onClick={onSelect}
      onDoubleClick={open}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold font-mono text-xs text-slate-900 dark:text-white">
              {permit.permit_number}
            </span>
            <PermitTypeBadge type={permit.permit_type} />
            <PermitStatusBadge status={permit.status} />
            <RiskBadge risk={permit.risk_level} />
          </div>
          <div className="mt-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
            {permit.title}
          </div>
        </div>
        <span className="shrink-0 text-[11px] font-bold text-amber-600 dark:text-amber-400">
          {timeLeft(permit.planned_end_at)}
        </span>
      </div>

      <div className="mt-2 grid gap-1 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="truncate">
          {permit.unit?.name ?? 'No unit'} · {permit.area?.name ?? permit.job_area ?? 'No area'}
        </div>
        <div className="truncate">
          {permit.equipment_tag ?? 'No equipment'} · {permit.holder?.displayName ?? 'No holder'}
        </div>
        <div className="font-mono text-[10px]">
          {formatClock(permit.planned_start_at)} - {formatClock(permit.planned_end_at)}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          <Indicator label="Gas" ok={latestGas?.result === 'PASS' || latestGas?.result === 'Pass'} />
          <Indicator label="Iso" ok={!isolationPending} warn={Boolean(isolationPending)} />
          <Indicator label="SIMOPS" ok={!openConflicts} warn={openConflicts > 0} />
          <Indicator label="H/O" ok={!handoverPending} warn={Boolean(handoverPending)} />
        </div>
      </div>
    </button>
  );
}

function Indicator({ label, ok, warn }: { label: string; ok?: boolean; warn?: boolean }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
        warn
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
          : ok
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
      }`}
    >
      {label}
    </span>
  );
}
