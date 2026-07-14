import { ActualSeverityBadge } from '../shared/ActualSeverityBadge';
import { InvestigationLevelBadge } from '../shared/InvestigationLevelBadge';
import { InvestigationPriorityBadge } from '../shared/InvestigationPriorityBadge';
import { PotentialRiskScoreBadge } from '../shared/PotentialRiskScoreBadge';
import { PotentialSeverityBadge } from '../shared/PotentialSeverityBadge';
import { OverviewPanelShell, SnapshotGrid } from './OverviewPanelShell';
export function SeverityRiskPotentialPanel({ data }: { data?: Record<string, any> }) {
  return <OverviewPanelShell title="Severity & Risk Potential Panel" subtitle="Actual severity and potential severity remain separate."><div className="mb-3 flex flex-wrap gap-2"><ActualSeverityBadge value={data?.actualSeverity}/><PotentialSeverityBadge value={data?.potentialSeverity}/><PotentialRiskScoreBadge value={data?.potentialRiskScore}/><InvestigationPriorityBadge value={data?.investigationPriority}/><InvestigationLevelBadge value={data?.investigationLevelRequired}/></div><SnapshotGrid data={data} fields={[['actualConsequenceCategory','Actual consequence category'],['potentialConsequenceCategory','Potential consequence category'],['likelihood','Likelihood'],['highPotentialNearMiss','High-potential near miss'],['fatalityPotential','Fatality potential'],['majorProcessSafetyPotential','Major PSM potential'],['potentialSeverityBasis','Potential severity basis'],['riskMatrixStatus','Risk matrix/configuration'],['severityReviewStatus','Severity review status'],['reviewedBy','Last reviewed by'],['reviewedAt','Last reviewed at']]} /></OverviewPanelShell>;
}
