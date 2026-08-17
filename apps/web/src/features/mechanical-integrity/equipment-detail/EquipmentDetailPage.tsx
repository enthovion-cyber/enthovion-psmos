'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEquipmentHeader } from '../hooks/useEquipmentHeader';
import { useEquipmentMutations } from '../hooks/useEquipmentMutations';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { MiNotFoundState } from '../shared/MiNotFoundState';
import { EquipmentDetailHeader } from './EquipmentDetailHeader';
import { EquipmentDetailTabs } from './EquipmentDetailTabs';
import { EquipmentStatusSummaryBar } from './EquipmentStatusSummaryBar';
import { EquipmentReadOnlyBanner } from './EquipmentReadOnlyBanner';
import { EquipmentArchivedBanner } from './EquipmentArchivedBanner';
import { EquipmentOverviewTab } from './overview/EquipmentOverviewTab';
import { EquipmentTechnicalDataTab } from './EquipmentTechnicalDataTab';
import { CmlRegistryPage } from '../cml/CmlRegistryPage';
import { InspectionPlanTab } from './tabs/InspectionPlanTab';
import { InspectionScheduleTab } from './tabs/InspectionScheduleTab';
import { InspectionRecordRegistryPage } from '../inspection-records/InspectionRecordRegistryPage';
import { RemainingLifePage } from '../remaining-life/RemainingLifePage';
import { CriticalityTab } from './tabs/CriticalityTab';
import { PreventiveMaintenanceTab } from './tabs/PreventiveMaintenanceTab';
import { CalibrationTab } from './tabs/CalibrationTab';
import { ReliefDevicesTab } from './tabs/ReliefDevicesTab';
import { SisSifInterlocksTab } from './tabs/SisSifInterlocksTab';
import { ImpairmentsTab } from './tabs/ImpairmentsTab';
import { DeficienciesTab } from './tabs/DeficienciesTab';
import { WorkOrdersActionsTab } from './tabs/WorkOrdersActionsTab';
import { FitnessReadinessTab } from './tabs/FitnessReadinessTab';
import { LinkedRecordsTab } from './tabs/LinkedRecordsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { ReportsExportTab } from './tabs/ReportsExportTab';
import { EquipmentHistoryTab } from './EquipmentHistoryTab';
import { EquipmentPlaceholderTab } from './EquipmentPlaceholderTab';
import type { MiDetailTabKey } from '../types/equipment-detail.types';
import { ChangeEquipmentStatusDialog } from './dialogs/ChangeEquipmentStatusDialog';
import { ArchiveEquipmentDialog } from './dialogs/ArchiveEquipmentDialog';
import { ReactivateEquipmentDialog } from './dialogs/ReactivateEquipmentDialog';
import { AddLinkedRecordDialog } from './dialogs/AddLinkedRecordDialog';
import { AddDocumentDialog } from './dialogs/AddDocumentDialog';

const validTabs = new Set<MiDetailTabKey>(['overview','technical-data','criticality','cml-tml','inspection-plan','inspection-records','remaining-life','preventive-maintenance','calibration-testing','psv-relief','sis-sif-interlocks','bypass-impairment','deficiencies','work-orders-actions','fitness-readiness','linked-records','documents-certificates','review-approval','history','reports-export']);

export function EquipmentDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeParam = searchParams.get('tab') as MiDetailTabKey | null;
  const tab = activeParam && validTabs.has(activeParam) ? activeParam : 'overview';
  const [dialog, setDialog] = useState<string | null>(null);
  const query = useEquipmentHeader(id);
  const mutations = useEquipmentMutations(id);
  const setTab = (nextTab: MiDetailTabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', nextTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const onAction = (key: string) => {
    if (key === 'export') window.open(`/api/v1/mechanical-integrity/equipment/${id}/export-summary`, '_blank');
    else if (key === 'history') setTab('history');
    else if (key === 'inspection-plan') setTab('inspection-plan');
    else if (key === 'edit') setTab('technical-data');
    else setDialog(key);
  };
  if (query.isLoading) return <MiLoadingSkeleton rows={5} />;
  if (query.isError || !query.data) return <MiNotFoundState />;
  const header = query.data;
  const equipment = header.equipment;
  return (
    <div className="space-y-5">
      <EquipmentArchivedBanner active={header.readOnly} />
      <EquipmentReadOnlyBanner reason={header.readOnlyReason} />
      <EquipmentDetailHeader equipment={equipment} actions={header.actions} onAction={onAction} />
      <EquipmentStatusSummaryBar items={header.statusSummary} onNavigate={setTab} />
      <EquipmentDetailTabs active={tab} onChange={setTab} />
      {tab === 'overview' ? <EquipmentOverviewTab id={id} /> : null}
      {tab === 'technical-data' ? <EquipmentTechnicalDataTab id={id} /> : null}
      {tab === 'criticality' ? <CriticalityTab equipmentId={id} /> : null}
      {tab === 'cml-tml' ? <CmlRegistryPage equipmentId={id} /> : null}
      {tab === 'inspection-plan' ? <InspectionPlanTab equipmentId={id} /> : null}
      {tab === 'inspection-records' ? <InspectionRecordRegistryPage equipmentId={id} /> : null}
      {tab === 'remaining-life' ? <RemainingLifePage equipmentId={id} /> : null}
      {tab === 'preventive-maintenance' ? <PreventiveMaintenanceTab equipmentId={id} /> : null}
      {tab === 'calibration-testing' ? <CalibrationTab equipmentId={id} /> : null}
      {tab === 'psv-relief' ? <ReliefDevicesTab equipmentId={id} /> : null}
      {tab === 'sis-sif-interlocks' ? <SisSifInterlocksTab equipmentId={id} /> : null}
      {tab === 'bypass-impairment' ? <ImpairmentsTab equipmentId={id} /> : null}
      {tab === 'deficiencies' ? <DeficienciesTab equipmentId={id} /> : null}
      {tab === 'work-orders-actions' ? <WorkOrdersActionsTab equipmentId={id} /> : null}
      {tab === 'fitness-readiness' ? <FitnessReadinessTab equipmentId={id} /> : null}
      {tab === 'linked-records' ? <LinkedRecordsTab equipmentId={id} /> : null}
      {tab === 'documents-certificates' ? <DocumentsTab equipmentId={id} /> : null}
      {tab === 'history' ? <EquipmentHistoryTab id={id} /> : null}
      {tab === 'reports-export' ? <ReportsExportTab equipmentId={id} /> : null}
      {!['overview','technical-data','criticality','cml-tml','inspection-plan','inspection-records','remaining-life','preventive-maintenance','calibration-testing','psv-relief','sis-sif-interlocks','bypass-impairment','deficiencies','work-orders-actions','fitness-readiness','linked-records','documents-certificates','history','reports-export'].includes(tab) ? <EquipmentPlaceholderTab tab={tab} equipment={equipment} /> : null}
      {dialog === 'status-change' ? <ChangeEquipmentStatusDialog onClose={() => setDialog(null)} saving={mutations.changeStatus.isPending} onSubmit={(input) => mutations.changeStatus.mutate(input, { onSuccess: () => setDialog(null) })} /> : null}
      {dialog === 'archive' ? <ArchiveEquipmentDialog onClose={() => setDialog(null)} saving={mutations.archive.isPending} onSubmit={(reason) => mutations.archive.mutate(reason, { onSuccess: () => setDialog(null) })} /> : null}
      {dialog === 'reactivate' ? <ReactivateEquipmentDialog onClose={() => setDialog(null)} saving={mutations.reactivate.isPending} onSubmit={(reason) => mutations.reactivate.mutate(reason, { onSuccess: () => setDialog(null) })} /> : null}
      {dialog === 'add-linked-record' ? <AddLinkedRecordDialog onClose={() => setDialog(null)} saving={mutations.addLinkedRecord.isPending} onSubmit={(input) => mutations.addLinkedRecord.mutate(input, { onSuccess: () => setDialog(null) })} /> : null}
      {dialog === 'add-document' ? <AddDocumentDialog onClose={() => setDialog(null)} saving={mutations.addDocument.isPending} onSubmit={(input) => mutations.addDocument.mutate(input, { onSuccess: () => setDialog(null) })} /> : null}
    </div>
  );
}
