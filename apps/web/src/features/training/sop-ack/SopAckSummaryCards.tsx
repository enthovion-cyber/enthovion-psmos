import { TrainingMetricCard } from '../shared/TrainingUi';

type SummaryCardConfig = [label: string, key: string, href: string | undefined, tone: 'neutral' | 'good' | 'warn' | 'danger' | undefined];

const cards: SummaryCardConfig[] = [
  ['Total SOP Acknowledgement Requirements', 'totalRequirements', undefined, undefined],
  ['Active Requirements', 'activeRequirements', '/training-competency/sop-acknowledgements/requirements?status=Active', 'good'],
  ['Workers Assigned', 'workersAssigned', undefined, undefined],
  ['Pending Acknowledgements', 'pendingAcknowledgements', '/training-competency/sop-acknowledgements/pending', 'warn'],
  ['Completed Acknowledgements', 'completedAcknowledgements', '/training-competency/sop-acknowledgements/completed', 'good'],
  ['Overdue Acknowledgements', 'overdueAcknowledgements', '/training-competency/sop-acknowledgements/overdue', 'danger'],
  ['Re-Acknowledgement Required', 'reacknowledgementRequired', '/training-competency/sop-acknowledgements/reacknowledgement-required', 'warn'],
  ['Current Version Gaps', 'currentVersionGaps', '/training-competency/sop-acknowledgements/current-version-gaps', 'danger'],
  ['Superseded Version Acknowledgements', 'supersededVersionAcknowledgements', undefined, 'danger'],
  ['Safety-Critical SOP Gaps', 'safetyCriticalSopGaps', '/training-competency/sop-acknowledgements/safety-critical', 'danger'],
  ['PTW SOP Blockers', 'ptwSopBlockers', '/training-competency/sop-acknowledgements/ptw-blockers', 'danger'],
  ['MOC SOP Blockers', 'mocSopBlockers', '/training-competency/sop-acknowledgements/moc-blockers', 'danger'],
  ['PSSR SOP Blockers', 'pssrSopBlockers', '/training-competency/sop-acknowledgements/pssr-blockers', 'danger'],
  ['Pending Verification', 'pendingVerification', '/training-competency/sop-acknowledgements/verification', 'warn'],
  ['Rejected Acknowledgements', 'rejectedAcknowledgements', undefined, 'danger'],
  ['Waivers Active', 'waiversActive', '/training-competency/sop-acknowledgements/waivers', 'warn'],
  ['SOPs Missing Acknowledgement Rule', 'sopsMissingAcknowledgementRule', undefined, undefined],
  ['Recent SOP Revision Impacts', 'recentSopRevisionImpacts', undefined, undefined],
  ['Matrix Gaps From SOP Acknowledgements', 'matrixGapsFromSopAcknowledgements', undefined, 'warn'],
  ['Competency Gaps From SOP Acknowledgements', 'competencyGapsFromSopAcknowledgements', undefined, 'warn']
];

export function SopAckSummaryCards({ summary = {} }: { summary?: Record<string, number> | undefined }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, key, href, tone]) => <TrainingMetricCard key={key} label={label} value={summary[key] ?? 0} href={href} tone={tone} />)}</div>;
}
