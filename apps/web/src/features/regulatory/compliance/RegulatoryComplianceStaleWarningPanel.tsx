import type { RegulatoryComplianceAssessment } from '../types/regulatory-compliance.types';
import { RegulatoryCard } from '../shared/RegulatoryUi';
import { RegulatoryComplianceStaleBadge } from '../shared/RegulatoryComplianceStaleBadge';

export function RegulatoryComplianceStaleWarningPanel({ assessment }: { assessment?: RegulatoryComplianceAssessment | null }) {
  const stale = assessment?.stale_status && assessment.stale_status !== 'Current';
  if (!stale) return null;
  return (
    <RegulatoryCard title="Stale Compliance Status" subtitle="This assessment requires review because source, applicability, evidence, gap, owner, or policy context changed.">
      <div className="flex flex-wrap items-start gap-3">
        <RegulatoryComplianceStaleBadge status={assessment?.stale_status} />
        <div className="text-sm text-[var(--psm-muted)]">
          <p className="font-semibold text-[var(--psm-fg)]">{assessment?.stale_reason ?? 'Backend marked this compliance status stale.'}</p>
          <p>Reassess before relying on this status for review, dashboard rollups, or report/export readiness.</p>
        </div>
      </div>
    </RegulatoryCard>
  );
}
