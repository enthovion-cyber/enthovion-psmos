import Link from 'next/link';
import { CompletenessScoreBadge } from '../components/shared/CompletenessScoreBadge';
import { PsiCard } from '../shared/PsiUi';

export function PsiCompletenessByUnitTable({ rows = [] }: { rows?: Array<Record<string, any>> }) {
  return (
    <PsiCard title="Unit Completeness" subtitle="Lowest scoring units are shown first for audit/PSSR focus.">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-[var(--psm-muted)]"><tr><th className="py-2">Unit</th><th className="py-2">Score</th><th className="py-2">Status</th><th className="py-2">Action</th></tr></thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.length ? rows.map((row) => <tr key={row.id}><td className="py-3 font-medium">{row.unit_code ?? row.label} {row.unit_name ?? ''}</td><td className="py-3">{Math.round(Number(row.completeness_score ?? row.score ?? 0))}%</td><td className="py-3"><CompletenessScoreBadge score={Number(row.completeness_score ?? row.score ?? 0)} status={row.completeness_status ?? row.status} /></td><td className="py-3"><Link className="text-primary" href={`/process-safety-information/units/${row.id}/completeness`}>Open</Link></td></tr>) : <tr><td colSpan={4} className="py-6 text-center text-[var(--psm-muted)]">No unit score data available.</td></tr>}
          </tbody>
        </table>
      </div>
    </PsiCard>
  );
}
