import { TrainingMetricCard } from '../shared/TrainingUi';

const cards = [
  ['Total MOC Training Requirements', 'totalMocTrainingRequirements'],
  ['MOCs Requiring Training', 'mocsRequiringTraining', 'warn'],
  ['MOCs With No Training Required', 'mocsWithNoTrainingRequired', 'good'],
  ['MOCs Pending Training Impact Check', 'mocsPendingTrainingImpactCheck', 'warn'],
  ['Training Assignments Generated', 'trainingAssignmentsGenerated'],
  ['Workers Assigned', 'workersAssigned'],
  ['Workers Completed', 'workersCompleted', 'good'],
  ['Workers Pending', 'workersPending', 'warn'],
  ['Workers Overdue', 'workersOverdue', 'danger'],
  ['Missing Evidence', 'missingEvidence', 'danger'],
  ['Pending Verification', 'pendingVerification', 'warn'],
  ['Pending SOP Acknowledgement', 'pendingSopAcknowledgement', 'warn'],
  ['Pending Assessment', 'pendingAssessment', 'warn'],
  ['Pending Certificate', 'pendingCertificate', 'warn'],
  ['MOC Implementation Blockers', 'mocImplementationBlockers', 'danger'],
  ['MOC Closure Blockers', 'mocClosureBlockers', 'danger'],
  ['PSSR Startup Blockers From MOC Training', 'pssrStartupBlockersFromMocTraining', 'danger'],
  ['Safety-Critical Training Gaps', 'safetyCriticalTrainingGaps', 'danger'],
  ['Waivers Active', 'waiversActive', 'warn'],
  ['MOCs Ready For Implementation', 'mocsReadyForImplementation', 'good'],
  ['MOCs Not Ready', 'mocsNotReady', 'danger'],
  ['Recent MOC Training Updates', 'recentMocTrainingUpdates']
] as const;

export function TrainingMocSummaryCards({ summary = {} }: { summary?: Record<string, any> }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">{cards.map(([label, key, tone]) => <TrainingMetricCard key={key} label={label} value={summary[key] ?? 0} tone={tone as any} />)}</div>;
}
