import { PsiCard } from '../../shared/PsiUi';
import type { ElectricalDetail } from '../../types/electrical-classification.types';

export function ProtectionRequirementsTab({ detail }: { detail: ElectricalDetail }) {
  return <PsiCard title="Equipment Protection Requirements" subtitle="Required protection method, EPL, Ex marking, group, temperature class, IP rating, cable glands, certificates, and inspection frequency."><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-sm">{JSON.stringify(detail.protectionRequirements ?? {}, null, 2)}</pre></PsiCard>;
}
