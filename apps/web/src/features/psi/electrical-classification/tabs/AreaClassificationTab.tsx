import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalDetail } from '../../types/electrical-classification.types';
import { HazardousAreaMapPlaceholder } from '../HazardousAreaMapPlaceholder';

export function AreaClassificationTab({ detail }: { detail: ElectricalDetail }) {
  return <div className="space-y-5"><PsiCard title="Area Classification" subtitle="IEC zone or NEC class/division, gas/dust group, temperature class, extent and boundary basis."><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-sm">{JSON.stringify(detail.areaDetails ?? {}, null, 2)}</pre></PsiCard><HazardousAreaMapPlaceholder /></div>;
}
