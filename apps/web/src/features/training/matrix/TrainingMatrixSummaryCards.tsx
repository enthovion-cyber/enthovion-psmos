import { TrainingMetricCard } from '../shared/TrainingUi';

export function TrainingMatrixSummaryCards({ summary = {} }: { summary?: Record<string, any> }) {
  const cards = [
    ['Total Matrix Rules', summary.totalMatrixRules, '/training-competency/training-matrix/rules'],
    ['Active Matrix Rules', summary.activeMatrixRules, '/training-competency/training-matrix/rules?active=true'],
    ['Workers Evaluated', summary.workersEvaluated, '/training-competency/training-matrix'],
    ['Workers Not Evaluated', summary.workersNotEvaluated, '/training-competency/training-matrix?status=Unknown'],
    ['Required Assignments', summary.requiredTrainingAssignments, '/training-competency/training-matrix'],
    ['Completed Requirements', summary.completedRequirements, '/training-competency/training-matrix'],
    ['Incomplete Requirements', summary.incompleteRequirements, '/training-competency/training-matrix/gaps'],
    ['Overdue Requirements', summary.overdueRequirements, '/training-competency/training-matrix/overdue'],
    ['Expiring Soon', summary.expiringSoon, '/training-competency/training-matrix/expiring'],
    ['Safety-Critical Gaps', summary.safetyCriticalTrainingGaps, '/training-competency/training-matrix/safety-critical-gaps'],
    ['Contractor Gaps', summary.contractorTrainingGaps, '/training-competency/training-matrix/gaps?gapType=Contractor%20Onboarding%20Gap'],
    ['PTW Role Gaps', summary.ptwRoleTrainingGaps, '/training-competency/training-matrix/gaps?ptwBlocker=true'],
    ['SOP Gaps', summary.sopTrainingGaps, '/training-competency/training-matrix/gaps?gapType=SOP%20Acknowledgement%20Missing'],
    ['MOC Gaps', summary.mocTrainingGaps, '/training-competency/training-matrix/gaps?mocBlocker=true'],
    ['PSSR Blockers', summary.pssrTrainingBlockers, '/training-competency/training-matrix/gaps?pssrBlocker=true'],
    ['Missing Evidence', summary.missingEvidence, '/training-competency/training-matrix/gaps?gapType=Missing%20Evidence'],
    ['Pending Verification', summary.pendingVerification, '/training-competency/training-matrix/gaps?gapStatus=Waiting%20Verification'],
    ['Active Waivers', summary.waiversActive, '/training-competency/training-matrix/gaps?gapStatus=Waived'],
    ['Evaluation Failures', summary.matrixEvaluationFailures, '/training-competency/training-matrix/run-history?status=Failed']
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">{cards.map(([label, value, href]) => <TrainingMetricCard key={label} label={label} value={value ?? 0} href={href} tone={String(label).includes('Failure') || String(label).includes('Blocker') ? 'danger' : String(label).includes('Gap') || String(label).includes('Missing') || String(label).includes('Overdue') ? 'warn' : 'neutral'} />)}</div>;
}
