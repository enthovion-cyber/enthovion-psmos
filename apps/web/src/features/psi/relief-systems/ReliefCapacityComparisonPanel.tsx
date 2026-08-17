import { PsiCard, PsiProgress } from '../shared/PsiUi';
import type { ReliefSystemDetail } from '../types/relief-system.types';

export function ReliefCapacityComparisonPanel({ detail }: { detail: ReliefSystemDetail }) {
  const basis = detail.reliefBasis;
  const required = Number(basis.required_relief_rate ?? detail.sizingBasis?.required_relief_rate ?? 0);
  const rated = Number(basis.rated_capacity ?? detail.sizingBasis?.rated_capacity ?? 0);
  const coverage = required > 0 ? Math.round((rated / required) * 100) : 0;
  return (
    <PsiCard title="Required Relief Rate vs Rated Capacity" subtitle="Capacity comparison uses backend sizing basis and linked device capacity values only.">
      <div className="space-y-3">
        <div className="flex flex-wrap justify-between gap-3 text-sm"><span>Required: <strong>{required || 'Missing'} {basis.required_relief_rate_unit ?? ''}</strong></span><span>Rated: <strong>{rated || 'Missing'} {basis.rated_capacity_unit ?? ''}</strong></span><span>Coverage: <strong>{coverage || 'Not calculated'}%</strong></span></div>
        <PsiProgress value={coverage} />
      </div>
    </PsiCard>
  );
}
