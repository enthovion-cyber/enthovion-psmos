'use client';

import { useMemo, useState } from 'react';
import { useElectricalClassificationDetail } from '../hooks/useElectricalClassificationDetail';
import { useElectricalClassificationMutations } from '../hooks/useElectricalClassificationMutations';
import { PsiButton, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { ElectricalClassificationDetailHeader } from './ElectricalClassificationDetailHeader';
import { AreaClassificationTab } from './tabs/AreaClassificationTab';
import { ElectricalChangeHistoryTab } from './tabs/ElectricalChangeHistoryTab';
import { ElectricalClassificationDocumentsTab } from './tabs/ElectricalClassificationDocumentsTab';
import { ElectricalCompletenessConflictsTab } from './tabs/ElectricalCompletenessConflictsTab';
import { ElectricalLinkedRecordsTab } from './tabs/ElectricalLinkedRecordsTab';
import { ElectricalOverviewTab } from './tabs/ElectricalOverviewTab';
import { ElectricalReviewApprovalTab } from './tabs/ElectricalReviewApprovalTab';
import { HazardousMaterialReleaseSourceTab } from './tabs/HazardousMaterialReleaseSourceTab';
import { InstalledEquipmentRatingTab } from './tabs/InstalledEquipmentRatingTab';
import { ProtectionRequirementsTab } from './tabs/ProtectionRequirementsTab';
import { PtwIgnitionControlsTab } from './tabs/PtwIgnitionControlsTab';
import { VentilationExtentBasisTab } from './tabs/VentilationExtentBasisTab';

const tabs = ['Overview', 'Hazardous Material / Release Source', 'Area Classification', 'Ventilation / Extent Basis', 'Equipment Protection Requirements', 'Installed Equipment / Rating Check', 'Drawings / Documents', 'PTW / Ignition Controls', 'Completeness / Conflicts', 'Linked Records', 'Review & Approval', 'Change History'] as const;

export function ElectricalClassificationDetailPage({ classificationId }: { classificationId: string }) {
  const detail = useElectricalClassificationDetail(classificationId);
  const mutations = useElectricalClassificationMutations(classificationId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const busy = useMemo(() => mutations.runRatingCheck.isPending || mutations.runCompleteness.isPending || mutations.runConflictCheck.isPending || mutations.submitReview.isPending, [mutations.runCompleteness.isPending, mutations.runConflictCheck.isPending, mutations.runRatingCheck.isPending, mutations.submitReview.isPending]);
  if (detail.isLoading) return <PsiLoadingState rows={8} />;
  if (detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  if (!detail.data) return null;
  const renderTab = () => {
    switch (activeTab) {
      case 'Hazardous Material / Release Source': return <HazardousMaterialReleaseSourceTab detail={detail.data} />;
      case 'Area Classification': return <AreaClassificationTab detail={detail.data} />;
      case 'Ventilation / Extent Basis': return <VentilationExtentBasisTab detail={detail.data} />;
      case 'Equipment Protection Requirements': return <ProtectionRequirementsTab detail={detail.data} />;
      case 'Installed Equipment / Rating Check': return <InstalledEquipmentRatingTab detail={detail.data} />;
      case 'Drawings / Documents': return <ElectricalClassificationDocumentsTab detail={detail.data} />;
      case 'PTW / Ignition Controls': return <PtwIgnitionControlsTab detail={detail.data} />;
      case 'Completeness / Conflicts': return <ElectricalCompletenessConflictsTab detail={detail.data} />;
      case 'Linked Records': return <ElectricalLinkedRecordsTab detail={detail.data} />;
      case 'Review & Approval': return <ElectricalReviewApprovalTab detail={detail.data} />;
      case 'Change History': return <ElectricalChangeHistoryTab detail={detail.data} />;
      default: return <ElectricalOverviewTab detail={detail.data} />;
    }
  };
  return <div className="space-y-5"><ElectricalClassificationDetailHeader detail={detail.data} busy={busy} onRunRatingCheck={() => void mutations.runRatingCheck.mutateAsync()} onRunCompleteness={() => void mutations.runCompleteness.mutateAsync()} onRunConflict={() => void mutations.runConflictCheck.mutateAsync()} onSubmitReview={() => void mutations.submitReview.mutateAsync({ reason: 'Submitted from PSI electrical classification detail.' })} /><div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2"><div className="flex min-w-max gap-2">{tabs.map((tab) => <PsiButton key={tab} variant={activeTab === tab ? 'primary' : 'secondary'} onClick={() => setActiveTab(tab)}>{tab}</PsiButton>)}</div></div>{renderTab()}</div>;
}
