'use client';

import Link from 'next/link';
import type { MiDeficiencyRow } from '../types/deficiency.types';
import { cardValue } from '../safeguards/SafeguardUiPrimitives';
import { DeficiencySeverityBadge } from '../shared/DeficiencySeverityBadge';
import { DeficiencyStatusBadge } from '../shared/DeficiencyStatusBadge';
import { ReadinessImpactBadge } from '../shared/ReadinessImpactBadge';

export function DeficiencyMobileCards({ rows = [] }: { rows?: MiDeficiencyRow[] | undefined }) {
  if (!rows.length) return null;
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <Link key={row.id} href={`/mechanical-integrity/deficiencies/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{cardValue(row.record_number)} - {cardValue(row.title)}</p>
              <p className="mt-1 text-sm text-[var(--psm-muted)]">{cardValue(row.equipment_tag ?? row.equipment_id)} · {cardValue(row.deficiency_type)}</p>
            </div>
            <DeficiencyStatusBadge status={row.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <DeficiencySeverityBadge severity={row.severity} />
            <ReadinessImpactBadge impact={row.fitness_for_service_impact} blocked={row.startup_blocker} />
          </div>
        </Link>
      ))}
    </div>
  );
}
