import { PsiMetricCard } from '../shared/PsiUi';
import type { EquipmentDesignSummary } from '../types/equipment-design.types';

const cards: Array<[string, keyof EquipmentDesignSummary, string, 'neutral' | 'good' | 'warn' | 'danger']> = [
  ['Total Records', 'totalEquipmentDesignBasisRecords', '/process-safety-information/equipment-design', 'neutral'],
  ['Complete Design Basis', 'equipmentWithCompleteDesignBasis', '/process-safety-information/equipment-design?completenessStatus=Complete', 'good'],
  ['Missing Design Basis', 'equipmentMissingDesignBasis', '/process-safety-information/equipment-design/missing', 'warn'],
  ['Safety-Critical Missing', 'safetyCriticalEquipmentMissingDesignBasis', '/process-safety-information/equipment-design/missing?safetyCritical=true', 'danger'],
  ['Critical Conflicts', 'criticalEquipmentWithConflicts', '/process-safety-information/equipment-design/conflicts', 'danger'],
  ['Pending Approval', 'designBasisPendingApproval', '/process-safety-information/equipment-design?reviewStatus=Submitted', 'warn'],
  ['Review Overdue', 'reviewOverdue', '/process-safety-information/equipment-design/review-overdue', 'danger'],
  ['MOC Required', 'mocRequired', '/process-safety-information/equipment-design/moc-required', 'warn'],
  ['Missing Datasheets', 'missingDatasheets', '/process-safety-information/equipment-design?missingDatasheet=true', 'warn'],
  ['Missing Design Code', 'missingDesignCode', '/process-safety-information/equipment-design?missingDesignCode=true', 'warn'],
  ['Missing Material', 'missingMaterialOfConstruction', '/process-safety-information/equipment-design?missingMaterial=true', 'warn'],
  ['Missing Pressure/Temp', 'missingDesignPressureTemperature', '/process-safety-information/equipment-design?missingDesignPressureTemperature=true', 'danger'],
  ['SOL Conflicts', 'solConflicts', '/process-safety-information/equipment-design/conflicts', 'danger'],
  ['Relief Conflicts', 'reliefBasisConflicts', '/process-safety-information/equipment-design/conflicts', 'warn'],
  ['MI Readiness Impact', 'miReadinessImpact', '/process-safety-information/equipment-design?miReadinessImpact=true', 'warn'],
  ['PSSR Blockers', 'pssrBlockers', '/process-safety-information/equipment-design?pssrBlocker=true', 'danger']
];

export function EquipmentDesignSummaryCards({ summary }: { summary: EquipmentDesignSummary }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, key, href, tone]) => <PsiMetricCard key={key} label={label} value={String(summary[key] ?? 0)} href={href} tone={tone} />)}</div>;
}
