import { DegradationMechanismCard } from '../DegradationMechanismCard';
import { MaterialRiskMatrix } from '../MaterialRiskMatrix';
import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import type { MaterialCompatibilityDetail } from '../../types/material-compatibility.types';

export function DegradationMechanismsTab({ detail }: { detail: MaterialCompatibilityDetail }) {
  return <div className="space-y-5"><MaterialRiskMatrix mechanisms={detail.degradationMechanisms} /><PsiCard title="Degradation / Failure Mechanisms" subtitle="Corrosion, SCC, H2 embrittlement, HTHA, erosion-corrosion, seal swelling, coating/lining failure, and MI follow-up basis.">{!detail.degradationMechanisms.length ? <PsiEmptyState title="No mechanisms recorded" message="No degradation mechanisms were returned from the backend for this compatibility record." /> : <div className="grid gap-3 md:grid-cols-2">{detail.degradationMechanisms.map((item) => <DegradationMechanismCard key={item.id} item={item} />)}</div>}</PsiCard></div>;
}

