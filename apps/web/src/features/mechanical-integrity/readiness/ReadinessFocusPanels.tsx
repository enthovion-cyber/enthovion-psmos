import Link from 'next/link';
import { ReadinessBlockerBadge } from '../shared/ReadinessBlockerBadge';
import { FitnessForServiceBadge } from '../shared/FitnessForServiceBadge';
import { SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';
import type { MiReadinessAssessment } from '../types/readiness.types';

function MiniList({ rows, empty }: { rows?: MiReadinessAssessment[] | undefined; empty: string }) {
  if (!rows?.length) return <p className="rounded-lg border border-dashed border-[var(--psm-line)] p-4 text-sm text-[var(--psm-muted)]">{empty}</p>;
  return (
    <div className="space-y-3">
      {rows.slice(0, 6).map((row) => (
        <Link key={row.id} href={`/mechanical-integrity/readiness/assessments/${row.id}`} className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 hover:border-primary/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{cardValue(row.equipment_tag ?? row.equipment_id)}</p>
              <p className="text-xs text-[var(--psm-muted)]">{cardValue(row.equipment_name ?? row.assessment_number)}</p>
            </div>
            <FitnessForServiceBadge decision={row.approved_decision ?? row.recommended_decision} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--psm-muted)]">
            <ReadinessBlockerBadge severity={(row.critical_blockers ?? 0) > 0 ? 'Critical' : 'Warning'} />
            <span>{row.blocker_count ?? 0} blockers</span>
            <span>{row.active_restrictions ?? 0} restrictions</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function StartupBlockerPanel({ rows }: { rows?: MiReadinessAssessment[] | undefined }) {
  return <SectionCard title="Startup Blocker Panel" description="Equipment with startup-blocking MI readiness issues."><MiniList rows={rows} empty="No startup blockers found for the current scope." /></SectionCard>;
}

export function NotFitEquipmentPanel({ rows }: { rows?: MiReadinessAssessment[] | undefined }) {
  return <SectionCard title="Not Fit Equipment Panel" description="Equipment that should not operate until blockers are cleared or formally overridden."><MiniList rows={rows} empty="No Not Fit equipment found." /></SectionCard>;
}

export function FitWithRestrictionsPanel({ rows }: { rows?: MiReadinessAssessment[] | undefined }) {
  return <SectionCard title="Fit With Restrictions Panel" description="Equipment allowed to operate only under defined limits, controls, review dates, and owners."><MiniList rows={rows} empty="No active fit-with-restrictions assessments found." /></SectionCard>;
}
