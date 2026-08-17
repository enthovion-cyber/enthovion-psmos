import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalDetail } from '../../types/electrical-classification.types';

export function VentilationExtentBasisTab({ detail }: { detail: ElectricalDetail }) {
  return <PsiCard title="Ventilation / Extent Basis" subtitle="Ventilation type, availability, effectiveness, air changes, open/enclosed area basis, extent calculations, and assumptions."><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-sm">{JSON.stringify(detail.ventilationBasis ?? {}, null, 2)}</pre></PsiCard>;
}
