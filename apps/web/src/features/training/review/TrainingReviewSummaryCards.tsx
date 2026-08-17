import { TrainingMetricCard } from '../shared/TrainingUi';

const cards: Array<[string, string, 'neutral' | 'good' | 'warn' | 'danger', string?]> = [
  ['Total Approval Requests', 'totalApprovalRequests', 'neutral', '/training-competency/review-approval/packages'],
  ['Pending My Review', 'pendingMyReview', 'warn', '/training-competency/review-approval/inbox'],
  ['My Submissions', 'mySubmissions', 'neutral', '/training-competency/review-approval/my-submissions'],
  ['Pending Approval', 'pendingApproval', 'warn', '/training-competency/review-approval/pending'],
  ['Overdue Reviews', 'overdueReviews', 'danger', '/training-competency/review-approval/overdue'],
  ['Returned Requests', 'returnedRequests', 'warn', '/training-competency/review-approval/returned'],
  ['Rejected Requests', 'rejectedRequests', 'danger', '/training-competency/review-approval/rejected'],
  ['Approved Requests', 'approvedRequests', 'good', '/training-competency/review-approval/approved'],
  ['Completed Requests', 'completedRequests', 'good', '/training-competency/review-approval/completed'],
  ['Escalated Requests', 'escalatedRequests', 'danger', '/training-competency/review-approval/escalated'],
  ['Stale Approval Packages', 'staleApprovalPackages', 'danger', '/training-competency/review-approval/stale'],
  ['Validation Failures', 'validationFailures', 'danger', '/training-competency/review-approval/validation-failures'],
  ['E-Signatures Pending', 'eSignaturesPending', 'warn', '/training-competency/review-approval/esignatures'],
  ['Safety-Critical Pending', 'safetyCriticalPending', 'danger'],
  ['Waivers Pending', 'waiversPending', 'warn'],
  ['PTW Authorizations Pending', 'ptwAuthorizationsPending', 'warn'],
  ['MOC Training Approvals Pending', 'mocTrainingApprovalsPending', 'warn'],
  ['PSSR Training Approvals Pending', 'pssrTrainingApprovalsPending', 'warn'],
  ['Reports Pending Approval', 'reportsPendingApproval', 'warn'],
  ['Average Approval Time', 'averageApprovalTime', 'neutral'],
  ['SLA Breaches', 'slaBreaches', 'danger']
];

export function TrainingReviewSummaryCards({ summary }: { summary?: Record<string, any> | undefined }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">{cards.map(([label, key, tone, href]) => <TrainingMetricCard key={key} label={label} value={summary?.[key] ?? 0} tone={tone} href={href} />)}</div>;
}
