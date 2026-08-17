import Link from 'next/link';
import type { ProcessChemistry } from '../types/process-chemistry.types';
import { ChemistryCompletenessBadge } from '../shared/ChemistryCompletenessBadge';
import { ChemistryTypeBadge } from '../shared/ChemistryTypeBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import { RunawayPotentialBadge } from '../shared/RunawayPotentialBadge';

export function ProcessChemistryMobileCards({ rows }: { rows: ProcessChemistry[] }) {
  return (
    <div className="space-y-3 lg:hidden">
      {rows.map((row) => (
        <Link key={row.id} href={`/process-safety-information/process-chemistry/${row.id}`} className="block rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex flex-wrap items-center gap-2"><ChemistryTypeBadge value={row.chemistry_type} /><RunawayPotentialBadge value={row.runaway_potential} /><PssrBlockerBadge value={row.pssr_blocker} /></div>
          <h2 className="mt-3 font-semibold text-[var(--psm-fg)]">{row.chemistry_name}</h2>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{row.process_chemistry_summary ?? row.main_reaction_equation ?? 'No summary recorded'}</p>
          <div className="mt-3"><ChemistryCompletenessBadge status={row.completeness_status} score={row.completeness_score} /></div>
        </Link>
      ))}
    </div>
  );
}
