import Link from 'next/link';
import type { MiSafeguardImpairment } from '../types/impairment.types';
import { BypassTypeBadge } from '../shared/BypassTypeBadge';
import { ExpiryStatusBadge } from '../shared/ExpiryStatusBadge';
import { ImpairmentRiskBadge } from '../shared/ImpairmentRiskBadge';
import { ImpairmentStatusBadge } from '../shared/ImpairmentStatusBadge';

export function ImpairmentMobileCards({ rows }: { rows?: MiSafeguardImpairment[] | undefined }) {
  if (!rows?.length) return null;
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <Link key={row.id} href={`/mechanical-integrity/bypass-impairments/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{row.record_number}</p>
              <p className="text-sm text-[var(--psm-muted)]">{row.safeguard_tag} · {row.safeguard_type}</p>
            </div>
            <ImpairmentStatusBadge status={row.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <BypassTypeBadge type={row.impairment_type} />
            <ImpairmentRiskBadge risk={row.risk_level} />
            <ExpiryStatusBadge status={row.expiryStatus ?? row.timeRemainingLabel} />
          </div>
          <p className="mt-3 text-sm">{row.reason || 'No reason recorded'}</p>
        </Link>
      ))}
    </div>
  );
}
