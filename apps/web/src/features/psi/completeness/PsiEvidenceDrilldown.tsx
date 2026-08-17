import type { PsiCompletenessGap } from '../types/psi-completeness.types';
import { PsiCard } from '../shared/PsiUi';

export function PsiEvidenceDrilldown({ gap }: { gap?: PsiCompletenessGap | null }) {
  return <PsiCard title="Evidence Drilldown" subtitle="No raw file links are exposed here; source evidence is resolved by backend and Document Control integrations."><p className="text-sm text-[var(--psm-muted)]">{gap?.evidence_found ?? 'Evidence missing or unavailable for this requirement.'}</p></PsiCard>;
}
