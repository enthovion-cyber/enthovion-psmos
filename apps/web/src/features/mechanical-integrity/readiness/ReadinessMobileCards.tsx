import Link from 'next/link';
import { FitnessForServiceBadge } from '../shared/FitnessForServiceBadge';
import { StartupBlockedBadge } from '../shared/StartupBlockedBadge';
import { cardValue } from '../safeguards/SafeguardUiPrimitives';
import type { MiReadinessAssessment } from '../types/readiness.types';

export function ReadinessMobileCards({ rows }: { rows?: MiReadinessAssessment[] }) {
  if (!rows?.length) return null;
  return (
    <div className="grid gap-3 xl:hidden">
      {rows.map((row) => (
        <Link key={row.id} href={`/mechanical-integrity/readiness/assessments/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{cardValue(row.equipment_tag ?? row.equipment_id)}</p>
              <p className="text-sm text-[var(--psm-muted)]">{cardValue(row.equipment_name ?? row.assessment_number)}</p>
            </div>
            <FitnessForServiceBadge decision={row.approved_decision ?? row.recommended_decision} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <span className="rounded-lg bg-[var(--psm-surface-2)] p-2">Blockers: {row.blocker_count ?? 0}</span>
            <span className="rounded-lg bg-[var(--psm-surface-2)] p-2">Critical: {row.critical_blockers ?? 0}</span>
            <span className="rounded-lg bg-[var(--psm-surface-2)] p-2">Restrictions: {row.active_restrictions ?? 0}</span>
            <span className="rounded-lg bg-[var(--psm-surface-2)] p-2">Next review: {cardValue(row.next_review_due, 'None')}</span>
          </div>
          <div className="mt-3"><StartupBlockedBadge blocked={row.startup_blocked} /></div>
        </Link>
      ))}
    </div>
  );
}
