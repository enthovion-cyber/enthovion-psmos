import { RegulatoryCard } from '../shared/RegulatoryUi';
import type { RegulatoryComplianceDetail } from '../types/regulatory-compliance.types';

export function ComplianceAssessmentSourceTab({ detail }: { detail?: RegulatoryComplianceDetail | undefined }) {
  const assessment = detail?.assessment;
  return <RegulatoryCard title="Source Snapshot" subtitle="Preserved backend source fields for auditability."><pre className="max-h-[520px] overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs text-[var(--psm-fg)]">{JSON.stringify(assessment?.source_snapshot_json ?? detail?.source ?? assessment, null, 2)}</pre></RegulatoryCard>;
}
