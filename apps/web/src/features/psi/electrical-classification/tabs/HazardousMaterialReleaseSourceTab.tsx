import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalDetail } from '../../types/electrical-classification.types';

export function HazardousMaterialReleaseSourceTab({ detail }: { detail: ElectricalDetail }) {
  const source = detail.hazardSource;
  return <PsiCard title="Hazardous Material / Release Source" subtitle="Chemical/SDS data, release source, release grade, operating state, frequency/duration, release basis, and missing data blockers."><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-sm">{JSON.stringify(source ?? {}, null, 2)}</pre></PsiCard>;
}
