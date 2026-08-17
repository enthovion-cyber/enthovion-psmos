import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalDetail } from '../../types/electrical-classification.types';

export function PtwIgnitionControlsTab({ detail }: { detail: ElectricalDetail }) {
  return <PsiCard title="PTW / Ignition Controls" subtitle="Hot work, gas testing, continuous monitoring, vehicle entry, non-Ex equipment, signage, access, bypass and permit controls."><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-sm">{JSON.stringify(detail.ptwControls ?? {}, null, 2)}</pre></PsiCard>;
}
