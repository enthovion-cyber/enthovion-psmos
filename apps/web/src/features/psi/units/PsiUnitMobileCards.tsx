import Link from 'next/link';
import type { PsiUnit } from '../types/psi-unit.types';
import { PsiCompletenessBadge } from '../shared/PsiCompletenessBadge';
import { PsiCriticalGapBadge } from '../shared/PsiCriticalGapBadge';
import { PsiStatusBadge } from '../shared/PsiStatusBadge';

export function PsiUnitMobileCards({ rows = [] }: { rows?: PsiUnit[] }) {
  return (
    <div className="space-y-3 lg:hidden">
      {rows.map((unit) => (
        <article key={unit.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">{unit.unit_code}</p>
              <h3 className="text-lg font-bold">{unit.unit_name}</h3>
              <p className="text-sm text-[var(--psm-muted)]">{unit.site?.name ?? unit.site_id}</p>
            </div>
            <PsiStatusBadge status={unit.psi_status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2"><PsiCompletenessBadge status={unit.completeness_status} score={Number(unit.completeness_score ?? 0)} /><PsiCriticalGapBadge count={unit.critical_gap_count} blocker={unit.pssr_blocker} /></div>
          <div className="mt-3 flex gap-3 text-sm font-semibold text-primary"><Link href={`/process-safety-information/units/${unit.id}`}>View</Link><Link href={`/process-safety-information/units/${unit.id}/edit`}>Edit</Link></div>
        </article>
      ))}
    </div>
  );
}
