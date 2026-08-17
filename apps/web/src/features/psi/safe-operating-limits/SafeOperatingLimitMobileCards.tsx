import Link from 'next/link';
import { LimitCompletenessBadge } from '../shared/LimitCompletenessBadge';
import { LimitConflictBadge } from '../shared/LimitConflictBadge';
import { LimitCriticalityBadge } from '../shared/LimitCriticalityBadge';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import type { SafeOperatingLimit } from '../types/safe-operating-limit.types';

export function SafeOperatingLimitMobileCards({ rows }: { rows: SafeOperatingLimit[] }) {
  return (
    <div className="space-y-3 xl:hidden">
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex items-start justify-between gap-3"><div><Link href={`/process-safety-information/safe-operating-limits/${row.id}`} className="font-semibold text-primary">{row.parameter_name}</Link><p className="text-sm text-[var(--psm-muted)]">{row.parameter_tag ?? row.limit_title}</p></div><LimitCriticalityBadge value={row.criticality} /></div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><dt className="text-[var(--psm-muted)]">Normal</dt><dd>{row.values?.normal_target ?? row.values?.normal_max ?? 'Missing'} {row.unit_of_measure}</dd></div><div><dt className="text-[var(--psm-muted)]">Review</dt><dd>{row.review_status}</dd></div><div><dt className="text-[var(--psm-muted)]">Conflict</dt><dd><LimitConflictBadge status={row.conflict_status} /></dd></div><div><dt className="text-[var(--psm-muted)]">Completeness</dt><dd><LimitCompletenessBadge status={row.completeness_status} score={row.completeness_score} /></dd></div></dl>
          <div className="mt-3 flex flex-wrap gap-2"><MocRequiredBadge value={row.moc_update_required} /><PssrBlockerBadge value={row.pssr_blocker} /></div>
        </article>
      ))}
    </div>
  );
}
