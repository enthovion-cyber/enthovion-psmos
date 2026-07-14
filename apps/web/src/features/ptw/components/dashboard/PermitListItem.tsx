import type { Permit } from '@/services/ptw.service';
import { PermitStatusBadge, PermitTypeBadge, RiskBadge } from '../PermitBadges';
import { timeLeft, formatClock } from './dashboard-ui';

export function PermitListItem({ permit, selected, onSelect }: { permit: Permit; selected: boolean; onSelect: () => void }) {
  const open = () => { window.location.href = `/ptw/${permit.id}`; };
  const latestGas = permit.gasTests?.[0];
  const openConflicts = permit.conflicts?.filter((item) => item.status === 'Open').length ?? 0;
  const isolationPending = permit.isolations?.some((item) => !['Confirmed', 'Verified', 'Fully Isolated'].includes(item.isolation_status ?? item.status));
  const handoverPending = permit.handovers?.some((item) => !item.acknowledged_at);
  return (
    <button className={`block w-full border-b border-cyan-300/10 px-3 py-3 text-left transition hover:bg-blue-500/10 ${selected ? 'bg-blue-600/24 ring-1 ring-inset ring-blue-400/40' : ''}`} onClick={onSelect} onDoubleClick={open}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{permit.permit_number}</span>
            <PermitTypeBadge type={permit.permit_type} />
            <PermitStatusBadge status={permit.status} />
            <RiskBadge risk={permit.risk_level} />
          </div>
          <div className="mt-1 truncate text-xs text-slate-300">{permit.title}</div>
        </div>
        <span className="shrink-0 text-xs font-semibold text-amber-300">{timeLeft(permit.planned_end_at)}</span>
      </div>
      <div className="mt-2 grid gap-1 text-[11px] text-slate-400 sm:grid-cols-2">
        <span>{permit.unit?.name ?? 'No unit'} · {permit.area?.name ?? permit.job_area ?? 'No area'}</span>
        <span>{permit.equipment_tag ?? 'No equipment'} · {permit.holder?.displayName ?? 'No holder'}</span>
        <span>{formatClock(permit.planned_start_at)} - {formatClock(permit.planned_end_at)}</span>
        <span className="flex flex-wrap gap-1">
          <Indicator label="Gas" ok={latestGas?.result === 'PASS' || latestGas?.result === 'Pass'} />
          <Indicator label="Iso" ok={!isolationPending} warn={Boolean(isolationPending)} />
          <Indicator label="SIMOPS" ok={!openConflicts} warn={openConflicts > 0} />
          <Indicator label="H/O" ok={!handoverPending} warn={Boolean(handoverPending)} />
        </span>
      </div>
    </button>
  );
}

function Indicator({ label, ok, warn }: { label: string; ok?: boolean; warn?: boolean }) {
  return <span className={`rounded px-1.5 py-0.5 ${warn ? 'bg-amber-500/15 text-amber-300' : ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-400'}`}>{label}</span>;
}
