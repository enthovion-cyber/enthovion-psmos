import Link from 'next/link';
import type { Permit } from '@/services/ptw.service';
import { PermitTypeBadge } from './PermitBadges';

export function PermitRegister({ permits }: { permits: Permit[] }) {
  return (
    <div className="max-h-[580px] overflow-auto">
      {permits.map((permit) => (
        <Link key={permit.id} href={`/ptw/${permit.id}`} className="block border-b border-[var(--psm-line)] p-3 hover:bg-[var(--psm-surface-2)]">
          <div className="flex items-center justify-between gap-2"><span className="font-semibold">{permit.permit_number}</span><span className="text-xs text-amber-300">{timeLeft(permit.planned_end_at)}</span></div>
          <div className="mt-1 text-xs text-[var(--psm-muted)]">{permit.job_area ?? permit.location} · {permit.equipment_tag ?? 'No equipment'}</div>
          <div className="mt-2"><PermitTypeBadge type={permit.permit_type} /></div>
        </Link>
      ))}
      {!permits.length ? <div className="p-6 text-center text-sm text-[var(--psm-muted)]">No permits match the current filters.</div> : null}
    </div>
  );
}

function timeLeft(date: string) {
  const ms = new Date(date).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}
