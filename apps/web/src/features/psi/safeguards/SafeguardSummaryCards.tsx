import { PsiMetricCard } from '../shared/PsiUi';
import type { SafeguardSummary } from '../types/safeguard.types';

const cards = [
  ['Total Safeguards / Controls', 'totalSafeguardsControls'],
  ['Critical Safeguards', 'criticalSafeguards', 'danger', '/process-safety-information/safeguards/critical'],
  ['Preventive Safeguards', 'preventiveSafeguards', 'good'],
  ['Detective Safeguards', 'detectiveSafeguards', 'info'],
  ['Mitigative Safeguards', 'mitigativeSafeguards', 'warn'],
  ['Administrative Controls', 'administrativeControls'],
  ['Instrumented Safeguards', 'instrumentedSafeguards', 'info'],
  ['Mechanical Safeguards', 'mechanicalSafeguards', 'good'],
  ['Procedural Controls', 'proceduralControls'],
  ['Emergency Response Controls', 'emergencyResponseControls', 'danger'],
  ['Linked to HAZOP', 'safeguardsLinkedToHazop'],
  ['Linked to LOPA', 'safeguardsLinkedToLopa'],
  ['Linked to SOL', 'safeguardsLinkedToSol'],
  ['Linked to SIF/SIS', 'safeguardsLinkedToSifSis'],
  ['Linked to PSV/Relief', 'safeguardsLinkedToPsvRelief'],
  ['Missing Safeguards', 'missingSafeguards', 'danger', '/process-safety-information/safeguards/missing'],
  ['Unverified Safeguards', 'unverifiedSafeguards', 'warn', '/process-safety-information/safeguards/unverified'],
  ['Bypassed / Impaired', 'bypassedImpairedSafeguards', 'danger', '/process-safety-information/safeguards/bypassed-impaired'],
  ['Overdue Testing / Proof Test', 'overdueTestingProofTest', 'danger', '/process-safety-information/safeguards/overdue-testing'],
  ['Missing Evidence Documents', 'missingEvidenceDocuments', 'warn'],
  ['Conflicts', 'conflicts', 'danger', '/process-safety-information/safeguards/conflicts'],
  ['Review Overdue', 'reviewOverdue', 'danger', '/process-safety-information/safeguards/review-overdue'],
  ['Pending Approval', 'pendingApproval', 'warn'],
  ['MOC Required', 'mocRequired', 'warn', '/process-safety-information/safeguards/moc-required'],
  ['PSSR Blockers', 'pssrBlockers', 'danger', '/process-safety-information/safeguards/pssr-blockers'],
  ['MI Readiness Impact', 'miReadinessImpact', 'warn']
] as const;

export function SafeguardSummaryCards({ summary }: { summary: SafeguardSummary }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, key, tone, href]) => <PsiMetricCard key={key} label={label} value={summary[key] ?? 0} tone={(tone ?? 'neutral') as any} href={href} />)}</div>;
}
