import { TrainingMetricCard } from '../shared/TrainingUi';

const cards = [
  ['Total Workforce', 'totalWorkforce', '/training-competency/workforce'],
  ['Active Employees', 'activeEmployees', '/training-competency/workforce?workerType=Employee'],
  ['Active Contractors', 'activeContractors', '/training-competency/workforce?workerType=Contractor'],
  ['No Site Assignment', 'workersWithoutSiteAssignment', '/training-competency/workforce?missingAssignment=true', 'warn'],
  ['Missing Role', 'workersMissingRoleAssignment', '/training-competency/workforce?missingRole=true', 'warn'],
  ['Training Complete', 'trainingComplete', '/training-competency/workforce?trainingStatus=Complete', 'good'],
  ['Training Incomplete', 'trainingIncomplete', '/training-competency/workforce?trainingStatus=Incomplete', 'warn'],
  ['Training Overdue', 'trainingOverdue', '/training-competency/workforce?trainingStatus=Overdue', 'danger'],
  ['Expiring Training', 'trainingExpiringSoon', '/training-competency/workforce?trainingStatus=Expiring Soon', 'warn'],
  ['Expiring Certs', 'certificationsExpiringSoon', '/training-competency/workforce?certificationStatus=Expiring Soon', 'warn'],
  ['Safety-Critical Gaps', 'safetyCriticalTrainingGaps', '/training-competency/workforce?safetyCriticalGap=true', 'danger'],
  ['PTW Auth Gaps', 'ptwAuthorizationGaps', '/training-competency/workforce?ptwAuthorizationStatus=Not Authorized', 'danger'],
  ['SOP Gaps', 'sopAcknowledgementGaps', '/training-competency/workforce'],
  ['MOC Pending', 'mocTrainingPending', '/training-competency/moc-training-requirements', 'warn'],
  ['PSSR Blockers', 'pssrTrainingBlockers', '/training-competency/pssr-training-readiness', 'danger'],
  ['Pending Review', 'workersPendingReview', '/training-competency/workforce?reviewStatus=Pending Review', 'warn'],
  ['Records Pending Approval', 'recordsPendingApproval', '/training-competency/review-approval', 'warn'],
  ['Recent Updates', 'recentTrainingUpdates', '/training-competency/history']
] as const;

export function TrainingSummaryCards({ summary = {} }: { summary?: Record<string, any> }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{cards.map(([label, key, href, tone]) => <TrainingMetricCard key={key} label={label} value={summary[key] ?? 0} href={href} tone={tone as any} />)}</div>;
}
