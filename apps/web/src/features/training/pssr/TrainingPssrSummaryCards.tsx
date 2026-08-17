import { TrainingMetricCard } from '../shared/TrainingUi';

const cards = [
  ['Total PSSR Training Readiness', 'totalPssrTrainingReadiness'],
  ['PSSRs Requiring Training', 'pssrsRequiringTraining', 'warn'],
  ['PSSRs With No Training Required', 'pssrsWithNoTrainingRequired', 'good'],
  ['PSSRs Pending Training Impact Check', 'pssrsPendingTrainingImpactCheck', 'warn'],
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
  ['PSSR Approval Blockers', 'pssrApprovalBlockers', 'danger'],
  ['PSSR Handover Blockers', 'pssrHandoverBlockers', 'danger'],
  ['PSSR Startup Blockers From PSSR Training', 'pssrStartupBlockersFromPssrTraining', 'danger'],
  ['Safety-Critical Training Gaps', 'safetyCriticalTrainingGaps', 'danger'],
  ['Waivers Active', 'waiversActive', 'warn'],
  ['PSSRs Ready For Approval', 'pssrsReadyForApproval', 'good'],
  ['PSSRs Not Ready', 'pssrsNotReady', 'danger'],
  ['Recent PSSR Training Updates', 'recentPssrTrainingUpdates']
] as const;

export function TrainingPssrSummaryCards({ summary = {} }: { summary?: Record<string, any> }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">{cards.map(([label, key, tone]) => <TrainingMetricCard key={key} label={label} value={summary[key] ?? 0} tone={tone as any} />)}</div>;
}

