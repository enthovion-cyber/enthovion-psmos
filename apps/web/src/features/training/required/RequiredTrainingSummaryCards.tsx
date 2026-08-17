import { TrainingMetricCard } from '../shared/TrainingUi';

const labels: Array<[string, string, string, 'neutral' | 'good' | 'warn' | 'danger']> = [
  ['Total', 'totalTrainingItems', '/training-competency/required-training/library', 'neutral'],
  ['Active', 'activeTrainingItems', '/training-competency/required-training/library?status=Active', 'good'],
  ['Draft', 'draftTrainingItems', '/training-competency/required-training/library?status=Draft', 'neutral'],
  ['Approved Current', 'approvedCurrent', '/training-competency/required-training/library?status=Approved%20Current', 'good'],
  ['Pending Approval', 'pendingApproval', '/training-competency/required-training/pending-approval', 'warn'],
  ['Review Overdue', 'reviewOverdue', '/training-competency/required-training/review-overdue', 'danger'],
  ['Safety-Critical', 'safetyCritical', '/training-competency/required-training/safety-critical', 'danger'],
  ['PTW Critical', 'ptwCritical', '/training-competency/required-training/ptw-critical', 'danger'],
  ['PSM Critical', 'psmCritical', '/training-competency/required-training/psm-critical', 'danger'],
  ['Matrix Linked', 'matrixLinked', '/training-competency/required-training/library?matrixSyncStatus=In%20Sync', 'good'],
  ['Competency Linked', 'competencyLinked', '/training-competency/required-training/library?competencySyncStatus=In%20Sync', 'good'],
  ['Evidence Missing', 'missingEvidencePolicy', '/training-competency/required-training/library', 'danger'],
  ['Docs Missing', 'missingApprovedDocuments', '/training-competency/required-training/library', 'danger'],
  ['Missing Owner', 'missingOwner', '/training-competency/required-training/library', 'warn'],
  ['Version Update Req.', 'versionUpdateRequired', '/training-competency/required-training/library', 'warn']
];

export function RequiredTrainingSummaryCards({ summary }: { summary?: Record<string, number> }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{labels.map(([label, key, href, tone]) => <TrainingMetricCard key={key} label={label} value={summary?.[key] ?? 0} href={href} tone={tone} />)}</div>;
}
