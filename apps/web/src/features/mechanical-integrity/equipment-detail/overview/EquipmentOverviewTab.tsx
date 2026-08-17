'use client';

import { useEquipmentOverview } from '../../hooks/useEquipmentOverview';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { EquipmentSnapshotCard } from './EquipmentSnapshotCard';
import { EquipmentIntegrityStatusCards } from './EquipmentIntegrityStatusCards';
import { EquipmentLocationHierarchyCard } from './EquipmentLocationHierarchyCard';
import { EquipmentTechnicalSummaryCard } from './EquipmentTechnicalSummaryCard';
import { EquipmentCriticalitySummaryCard } from './EquipmentCriticalitySummaryCard';
import { EquipmentScheduleSummaryCard } from './EquipmentScheduleSummaryCard';
import { EquipmentInspectionPlanSummaryCard } from './EquipmentInspectionPlanSummaryCard';
import { EquipmentInspectionDueStatusCard } from './EquipmentInspectionDueStatusCard';
import { EquipmentPmSummaryCard } from './EquipmentPmSummaryCard';
import { EquipmentCalibrationSummaryCard } from './EquipmentCalibrationSummaryCard';
import { EquipmentReliefProtectionSummaryCard } from './EquipmentReliefProtectionSummaryCard';
import { EquipmentReliefReadinessCard } from './EquipmentReliefReadinessCard';
import { EquipmentCmlSummaryCard } from './EquipmentCmlSummaryCard';
import { EquipmentSafeguardSummaryCard } from './EquipmentSafeguardSummaryCard';
import { EquipmentBypassSummaryCard } from './EquipmentBypassSummaryCard';
import { EquipmentDeficiencySummaryCard } from './EquipmentDeficiencySummaryCard';
import { EquipmentReadinessSummaryCard } from './EquipmentReadinessSummaryCard';
import { EquipmentLinkedRecordsSummaryCard } from './EquipmentLinkedRecordsSummaryCard';
import { EquipmentDocumentsSummaryCard } from './EquipmentDocumentsSummaryCard';
import { EquipmentRecentActivityCard } from './EquipmentRecentActivityCard';
import { EquipmentOpenBlockersCard } from './EquipmentOpenBlockersCard';

export function EquipmentOverviewTab({ id }: { id: string }) {
  const query = useEquipmentOverview(id);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="psm-card p-6 text-danger">Overview unavailable.</div>;
  const data = query.data;
  return (
    <div className="space-y-5">
      <EquipmentSnapshotCard snapshot={data.snapshot} />
      <EquipmentIntegrityStatusCards cards={data.statusCards} />
      <div className="grid gap-5 xl:grid-cols-2">
        <EquipmentLocationHierarchyCard equipment={data.equipment} />
        <EquipmentTechnicalSummaryCard technical={data.technicalSummary} />
        <EquipmentCriticalitySummaryCard summary={data.criticalitySummary} />
        <EquipmentScheduleSummaryCard summary={data.scheduleSummary} />
        <EquipmentPmSummaryCard summary={data.scheduleSummary as Record<string, unknown>} />
        <EquipmentCalibrationSummaryCard summary={data.scheduleSummary as Record<string, unknown>} />
        <EquipmentReliefProtectionSummaryCard equipmentId={id} />
        <EquipmentReliefReadinessCard equipmentId={id} />
        <EquipmentInspectionPlanSummaryCard summary={(data as any).inspectionPlanSummary} />
        <EquipmentInspectionDueStatusCard summary={(data as any).inspectionPlanSummary} />
        <EquipmentCmlSummaryCard summary={data.cmlSummary} />
        <EquipmentSafeguardSummaryCard summary={data.safeguardSummary} />
        <EquipmentBypassSummaryCard summary={data.bypassSummary} />
        <EquipmentDeficiencySummaryCard summary={data.deficiencySummary} />
        <EquipmentReadinessSummaryCard summary={data.readinessSummary} />
        <EquipmentLinkedRecordsSummaryCard equipmentId={id} />
        <EquipmentDocumentsSummaryCard summary={data.documentsSummary} />
        <EquipmentRecentActivityCard items={data.recentActivity} />
        <EquipmentOpenBlockersCard blockers={data.blockers} />
      </div>
    </div>
  );
}
