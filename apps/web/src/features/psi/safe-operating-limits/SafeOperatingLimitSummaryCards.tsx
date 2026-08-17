import { PsiMetricCard } from '../shared/PsiUi';
import type { SafeOperatingLimitSummary } from '../types/safe-operating-limit.types';

const cards: Array<[string, keyof SafeOperatingLimitSummary, string, 'neutral' | 'good' | 'warn' | 'danger']> = [
  ['Total Safe Operating Limits', 'totalSafeOperatingLimits', '/process-safety-information/safe-operating-limits', 'neutral'],
  ['Critical Limits', 'criticalLimits', '/process-safety-information/safe-operating-limits/critical', 'danger'],
  ['Safety-Critical Limits', 'safetyCriticalLimits', '/process-safety-information/safe-operating-limits?search=&safetyCritical=true', 'danger'],
  ['Unit-Level Limits', 'unitLevelLimits', '/process-safety-information/safe-operating-limits?limitScope=Unit-level', 'neutral'],
  ['Equipment-Level Limits', 'equipmentLevelLimits', '/process-safety-information/safe-operating-limits?limitScope=Equipment-level', 'neutral'],
  ['Missing Critical Limits', 'missingCriticalLimits', '/process-safety-information/safe-operating-limits/missing', 'danger'],
  ['Missing Consequences', 'limitsWithMissingConsequences', '/process-safety-information/safe-operating-limits/missing?missingConsequence=true', 'warn'],
  ['Missing Operator Response', 'limitsWithMissingOperatorResponse', '/process-safety-information/safe-operating-limits/missing?missingOperatorResponse=true', 'warn'],
  ['Missing Safeguards', 'limitsWithMissingSafeguards', '/process-safety-information/safe-operating-limits/missing?missingSafeguard=true', 'danger'],
  ['Limits With Conflicts', 'limitsWithConflicts', '/process-safety-information/safe-operating-limits/conflicts', 'danger'],
  ['Pending Approval', 'limitsPendingApproval', '/process-safety-information/safe-operating-limits?reviewStatus=Submitted', 'warn'],
  ['Review Overdue', 'limitsReviewOverdue', '/process-safety-information/safe-operating-limits/review-overdue', 'danger'],
  ['MOC Required', 'limitsRequiringMoc', '/process-safety-information/safe-operating-limits/moc-required', 'warn'],
  ['Linked to HAZOP', 'limitsLinkedToHazop', '/process-safety-information/safe-operating-limits?linkedHazop=true', 'neutral'],
  ['Linked Alarm/Interlock/SIF', 'limitsLinkedToSisInterlockAlarm', '/process-safety-information/safe-operating-limits?linkedAlarmInterlockSif=true', 'neutral'],
  ['PSSR Blockers', 'pssrBlockers', '/process-safety-information/safe-operating-limits?pssrBlocker=true', 'danger']
];

export function SafeOperatingLimitSummaryCards({ summary }: { summary: SafeOperatingLimitSummary }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, key, href, tone]) => <PsiMetricCard key={key} label={label} value={summary[key] as number} href={href} tone={tone} />)}</div>;
}
