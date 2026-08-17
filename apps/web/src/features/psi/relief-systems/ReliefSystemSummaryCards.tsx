import { PsiMetricCard } from '../shared/PsiUi';
import type { ReliefSystemSummary } from '../types/relief-system.types';

const cards: Array<[string, keyof ReliefSystemSummary, string, 'neutral' | 'good' | 'warn' | 'danger']> = [
  ['Total Relief Basis Records', 'totalReliefBasisRecords', '/process-safety-information/relief-systems', 'neutral'],
  ['Protected Equipment Count', 'protectedEquipmentCount', '/process-safety-information/relief-systems', 'neutral'],
  ['Equipment Missing Relief Basis', 'equipmentMissingReliefBasis', '/process-safety-information/relief-systems/missing', 'warn'],
  ['Safety-Critical Missing', 'safetyCriticalEquipmentMissingReliefBasis', '/process-safety-information/relief-systems/missing?safetyCritical=true', 'danger'],
  ['Relief Devices Linked', 'reliefDevicesLinked', '/process-safety-information/relief-systems?deviceLinked=true', 'good'],
  ['Relief Devices Not Linked', 'reliefDevicesNotLinked', '/process-safety-information/relief-systems?deviceLinked=false', 'warn'],
  ['Governing Cases Defined', 'governingCasesDefined', '/process-safety-information/relief-systems/governing-cases', 'good'],
  ['Missing Governing Case', 'missingGoverningCase', '/process-safety-information/relief-systems/missing?missingGoverningCase=true', 'danger'],
  ['Missing Relief Calculation', 'missingReliefCalculation', '/process-safety-information/relief-systems/missing?missingCalculation=true', 'danger'],
  ['Missing Relief Destination', 'missingReliefDestination', '/process-safety-information/relief-systems/missing?missingDestination=true', 'warn'],
  ['Missing P&ID / Datasheet', 'missingPidOrDatasheet', '/process-safety-information/relief-systems/missing?missingDocument=true', 'warn'],
  ['Relief Basis Conflicts', 'reliefBasisConflicts', '/process-safety-information/relief-systems/conflicts', 'danger'],
  ['SOL Conflicts', 'solConflicts', '/process-safety-information/relief-systems/conflicts?source=SOL', 'danger'],
  ['Equipment Design Conflicts', 'equipmentDesignBasisConflicts', '/process-safety-information/relief-systems/conflicts?source=EquipmentDesign', 'danger'],
  ['MI Relief Device Conflicts', 'miReliefDeviceConflicts', '/process-safety-information/relief-systems/conflicts?source=MI', 'danger'],
  ['Review Overdue', 'reviewOverdue', '/process-safety-information/relief-systems/review-overdue', 'danger'],
  ['Pending Approval', 'pendingApproval', '/process-safety-information/relief-systems?reviewStatus=Submitted', 'warn'],
  ['MOC Required', 'mocRequired', '/process-safety-information/relief-systems/moc-required', 'warn'],
  ['PSSR Blockers', 'pssrBlockers', '/process-safety-information/relief-systems/pssr-blockers', 'danger'],
  ['MI Readiness Impact', 'miReadinessImpact', '/process-safety-information/relief-systems?miReadinessImpact=true', 'warn']
];

export function ReliefSystemSummaryCards({ summary }: { summary: ReliefSystemSummary }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, key, href, tone]) => <PsiMetricCard key={key} label={label} value={String(summary[key] ?? 0)} href={href} tone={tone} />)}</div>;
}
