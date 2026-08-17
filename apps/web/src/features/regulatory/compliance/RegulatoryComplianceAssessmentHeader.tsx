import { RegulatoryButton, RegulatoryCard } from '../shared/RegulatoryUi';
import { RegulatoryComplianceStatusBadge } from '../shared/RegulatoryComplianceStatusBadge';
import { RegulatoryComplianceAssessmentStatusBadge } from '../shared/RegulatoryComplianceAssessmentStatusBadge';
import { RegulatoryComplianceStaleBadge } from '../shared/RegulatoryComplianceStaleBadge';
import { RegulatoryEvidenceReadinessBadge } from '../shared/RegulatoryEvidenceReadinessBadge';
import type { RegulatoryComplianceAssessment } from '../types/regulatory-compliance.types';

const tabs = [
  ['Overview', 'overview'],
  ['Source', 'source'],
  ['Evidence Readiness', 'evidence-readiness'],
  ['Gaps', 'gaps'],
  ['Actions', 'actions'],
  ['Decision', 'decision'],
  ['History', 'history']
] as const;

export function RegulatoryComplianceAssessmentHeader({ assessment, activeTab }: { assessment?: RegulatoryComplianceAssessment | undefined; activeTab?: string | undefined }) {
  const base = `/regulatory/compliance-status/assessments/${assessment?.id}`;
  return (
    <RegulatoryCard title={`${assessment?.assessment_number ?? 'Compliance Assessment'} - ${assessment?.assessment_title ?? 'Untitled'}`} subtitle={assessment?.source_label ?? assessment?.source_title ?? 'No source label returned.'} action={<RegulatoryButton href="/regulatory/compliance-status/register" variant="secondary">Back to Register</RegulatoryButton>}>
      <div className="mb-4 flex flex-wrap gap-2"><RegulatoryComplianceStatusBadge status={assessment?.compliance_status} /><RegulatoryComplianceAssessmentStatusBadge status={assessment?.assessment_status} /><RegulatoryEvidenceReadinessBadge status={assessment?.evidence_readiness_status} /><RegulatoryComplianceStaleBadge status={assessment?.stale_status} /></div>
      {assessment?.readOnly ? <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600">{assessment.readOnlyReason ?? 'This assessment is read-only.'}</div> : null}
      <nav className="flex gap-2 overflow-auto">{tabs.map(([label, tab]) => <RegulatoryButton key={tab} href={tab === 'overview' ? base : `${base}/${tab}`} variant={activeTab === tab ? 'primary' : 'secondary'}>{label}</RegulatoryButton>)}</nav>
    </RegulatoryCard>
  );
}
