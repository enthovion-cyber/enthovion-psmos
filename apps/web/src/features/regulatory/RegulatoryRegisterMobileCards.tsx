import Link from 'next/link';
import type { RegulatoryItem } from './types/regulatory.types';
import { RegulatoryStatusBadge } from './shared/RegulatoryStatusBadge';
import { RegulatoryComplianceStatusBadge } from './shared/RegulatoryComplianceStatusBadge';
import { RegulatoryCriticalityBadge } from './shared/RegulatoryCriticalityBadge';

export function RegulatoryRegisterMobileCards({ rows }: { rows: RegulatoryItem[] }) {
  if (!rows.length) return <p className="text-sm text-[var(--psm-muted)]">No regulatory register items match the current filters.</p>;
  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <Link key={row.id} href={`/regulatory/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <div className="font-semibold text-[var(--psm-fg)]">{row.requirement_code} - {row.requirement_title ?? 'Untitled draft'}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <RegulatoryStatusBadge status={row.register_status} />
            <RegulatoryCriticalityBadge criticality={row.criticality} />
            <RegulatoryComplianceStatusBadge status={row.compliance_status} />
          </div>
          <p className="mt-2 text-xs text-[var(--psm-muted)]">{row.category ?? 'No category'} · Owner: {row.owner?.displayName ?? row.owner_user_id ?? 'Missing'}</p>
        </Link>
      ))}
    </div>
  );
}
