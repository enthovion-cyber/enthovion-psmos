import { TrainingMetricCard } from '../shared/TrainingUi';

const cards = [
  ['Total Workers', 'totalWorkers'],
  ['Active Workers', 'activeWorkers', 'good'],
  ['Employees', 'employees'],
  ['Contractors', 'contractors'],
  ['Vendors', 'vendors'],
  ['Trainees', 'trainees'],
  ['Visitors', 'visitors'],
  ['Inactive / Archived', 'inactiveArchived', 'warn'],
  ['Missing Site', 'missingSiteAssignment', 'warn'],
  ['Missing Role', 'missingRoleAssignment', 'warn'],
  ['Training Complete', 'trainingComplete', 'good'],
  ['Training Incomplete', 'trainingIncomplete', 'warn'],
  ['Training Overdue', 'trainingOverdue', 'danger'],
  ['Certification Expiring', 'certificationExpiring', 'warn'],
  ['Pending Review', 'pendingReview', 'warn'],
  ['Blocked Safety-Critical', 'blockedFromSafetyCriticalWork', 'danger']
] as const;

export function WorkforceSummaryCards({ summary = {} }: { summary?: Record<string, any> }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, key, tone]) => <TrainingMetricCard key={key} label={label} value={summary[key] ?? 0} tone={tone as any} />)}</div>;
}
