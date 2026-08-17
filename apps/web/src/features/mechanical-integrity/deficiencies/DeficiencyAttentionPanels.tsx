'use client';

import Link from 'next/link';
import type { MiDeficiencyRow } from '../types/deficiency.types';
import { SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';
import { DeficiencySeverityBadge } from '../shared/DeficiencySeverityBadge';
import { DeficiencyStatusBadge } from '../shared/DeficiencyStatusBadge';
import { ReadinessImpactBadge } from '../shared/ReadinessImpactBadge';

function CompactList({ rows, empty }: { rows: MiDeficiencyRow[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-[var(--psm-muted)]">{empty}</p>;
  return (
    <div className="space-y-2">
      {rows.slice(0, 6).map((row) => (
        <Link key={row.id} href={`/mechanical-integrity/deficiencies/${row.id}`} className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{cardValue(row.record_number)} - {cardValue(row.title)}</p>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">{cardValue(row.equipment_tag ?? row.equipment_id)} · {cardValue(row.source_module)}</p>
            </div>
            <DeficiencyStatusBadge status={row.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <DeficiencySeverityBadge severity={row.severity} />
            <ReadinessImpactBadge impact={row.fitness_for_service_impact} blocked={row.startup_blocker} />
          </div>
        </Link>
      ))}
    </div>
  );
}

export function CriticalDeficiencyPanel({ rows = [] }: { rows?: MiDeficiencyRow[] | undefined }) {
  const critical = rows.filter((row) => row.severity === 'Critical' || row.risk_level === 'Critical');
  return <SectionCard title="Critical Deficiency Panel" description="Critical equipment, safety, PSM, regulatory, and startup readiness impacts."><CompactList rows={critical} empty="No critical deficiencies in the current filter." /></SectionCard>;
}

export function OverdueDeficiencyPanel({ rows = [] }: { rows?: MiDeficiencyRow[] | undefined }) {
  const today = new Date();
  const overdue = rows.filter((row) => row.due_date && new Date(row.due_date) < today && !['Closed','Rejected','Cancelled'].includes(String(row.status)));
  return <SectionCard title="Overdue Panel" description="Open deficiencies past their due date."><CompactList rows={overdue} empty="No overdue deficiencies in the current filter." /></SectionCard>;
}

export function StartupBlockerPanel({ rows = [] }: { rows?: MiDeficiencyRow[] | undefined }) {
  const blockers = rows.filter((row) => row.startup_blocker || row.pssr_impact);
  return <SectionCard title="Startup Blocker Panel" description="Items that must feed PSSR and readiness blockers."><CompactList rows={blockers} empty="No startup blockers in the current filter." /></SectionCard>;
}

export function DeviationExpiryPanel({ rows = [] }: { rows?: Array<{ id: string; record_number?: string | null; title?: string | null; expiry_date?: string | null; status?: string | null }> | undefined }) {
  const today = new Date();
  const expiring = rows.filter((row) => row.expiry_date && new Date(row.expiry_date) <= new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000) && row.status !== 'Closed');
  return (
    <SectionCard title="Deviation Expiry Panel" description="Temporary deviations and controls that are expired or approaching expiry.">
      {!expiring.length ? <p className="text-sm text-[var(--psm-muted)]">No expiring deviations in the current filter.</p> : (
        <div className="space-y-2">
          {expiring.slice(0, 6).map((row) => (
            <Link key={row.id} href={`/mechanical-integrity/deviations/${row.id}`} className="flex items-center justify-between rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">
              <span className="font-semibold">{cardValue(row.record_number)} - {cardValue(row.title)}</span>
              <span className="text-warning">{cardValue(row.expiry_date)}</span>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
