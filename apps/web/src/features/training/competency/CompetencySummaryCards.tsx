import { TrainingMetricCard } from '../shared/TrainingUi';

const cards = [
  ['Total Competency Profiles', 'totalCompetencyProfiles'], ['Active Profiles', 'activeProfiles', 'good'], ['Draft Profiles', 'draftProfiles', 'info'], ['Approved Profiles', 'approvedProfiles', 'good'], ['Profiles Pending Review', 'profilesPendingReview', 'warn'], ['Profiles Review Overdue', 'profilesReviewOverdue', 'danger'], ['Workers Assigned to Profiles', 'workersAssignedToProfiles'], ['Workers Missing Profile', 'workersMissingProfile', 'danger'], ['Competency Requirements', 'competencyRequirements'], ['Safety-Critical Competencies', 'safetyCriticalCompetencies', 'danger'], ['PSM-Critical Competencies', 'psmCriticalCompetencies', 'warn'], ['PTW-Critical Competencies', 'ptwCriticalCompetencies', 'warn'], ['Competent Workers', 'competentWorkers', 'good'], ['Partially Competent Workers', 'partiallyCompetentWorkers', 'warn'], ['Not Competent Workers', 'notCompetentWorkers', 'danger'], ['Pending Assessment', 'pendingAssessment', 'warn'], ['Expired Competency', 'expiredCompetency', 'danger'], ['Competency Gaps', 'competencyGaps', 'danger'], ['Safety-Critical Competency Gaps', 'safetyCriticalCompetencyGaps', 'danger'], ['Profiles Requiring Matrix Update', 'profilesRequiringMatrixUpdate', 'warn']
] as const;

export function CompetencySummaryCards({ summary = {} }: { summary?: Record<string, any> }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, key, tone]) => { const href = linkFor(key); return <TrainingMetricCard key={key} label={label} value={summary[key] ?? 0} tone={(tone as any) ?? 'neutral'} {...(href ? { href } : {})} />; })}</div>;
}

function linkFor(key: string) {
  if (key.includes('Gap')) return '/training-competency/roles-competency-profiles/gaps';
  if (key.includes('Profile')) return '/training-competency/roles-competency-profiles/profiles';
  return undefined;
}
