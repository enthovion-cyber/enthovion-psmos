import Link from 'next/link';
import { FitnessForServiceBadge } from '../shared/FitnessForServiceBadge';
import { ReadinessStatusBadge } from '../shared/ReadinessStatusBadge';
import { StartupBlockedBadge } from '../shared/StartupBlockedBadge';
import { ActionButton, cardValue } from '../safeguards/SafeguardUiPrimitives';
import type { MiReadinessAssessment } from '../types/readiness.types';

export function ReadinessTable({ rows }: { rows?: MiReadinessAssessment[] }) {
  if (!rows?.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-8 text-sm text-[var(--psm-muted)]">No readiness assessments match the current filters.</div>;
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] xl:block">
      <table className="min-w-[1700px] w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>
            {['Equipment Tag','Equipment Name','Equipment Type','Site / Unit / Area','Current Readiness','Recommended Decision','Approved Decision','Blockers','Critical','Restrictions','FFS Required','Engineering Review','MOC Required','PSSR Impact','Last Assessment','Next Review Due','Approved By','Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
              <td className="px-4 py-3 font-semibold">{cardValue(row.equipment_tag ?? row.equipment_id)}</td>
              <td className="px-4 py-3">{cardValue(row.equipment_name)}</td>
              <td className="px-4 py-3">{cardValue(row.equipment_type)}</td>
              <td className="px-4 py-3">{cardValue((row.equipment as any)?.siteName ?? row.site_id)}</td>
              <td className="px-4 py-3"><ReadinessStatusBadge status={row.status} /></td>
              <td className="px-4 py-3"><FitnessForServiceBadge decision={row.recommended_decision} /></td>
              <td className="px-4 py-3"><FitnessForServiceBadge decision={row.approved_decision} /></td>
              <td className="px-4 py-3">{row.blocker_count ?? 0}</td>
              <td className="px-4 py-3">{row.critical_blockers ?? 0}</td>
              <td className="px-4 py-3">{row.active_restrictions ?? 0}</td>
              <td className="px-4 py-3">{cardValue(row.ffs_required)}</td>
              <td className="px-4 py-3">{/Engineering/.test(row.recommended_decision) ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3">{cardValue(row.moc_required)}</td>
              <td className="px-4 py-3"><StartupBlockedBadge blocked={row.pssr_impact || row.startup_blocked} /></td>
              <td className="px-4 py-3">{cardValue(row.assessment_date)}</td>
              <td className="px-4 py-3">{cardValue(row.next_review_due)}</td>
              <td className="px-4 py-3">{cardValue(row.approved_by)}</td>
              <td className="px-4 py-3">
                <Link href={`/mechanical-integrity/readiness/assessments/${row.id}`}><ActionButton>Open</ActionButton></Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
