import { RegulatoryCard } from '../shared/RegulatoryUi';
import type { RegulatoryComplianceDetail } from '../types/regulatory-compliance.types';

export function ComplianceDecisionTab({ detail }: { detail?: RegulatoryComplianceDetail | undefined }) {
  return <RegulatoryCard title="Compliance Status Decision" subtitle="Backend-owned decision, rationale, manual declaration, disabled reasons, and readiness."><pre className="max-h-[520px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-fg)]">{JSON.stringify(detail?.decision ?? {}, null, 2)}</pre></RegulatoryCard>;
}
