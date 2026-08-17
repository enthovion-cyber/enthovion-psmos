'use client';

import { useMemo, useState } from 'react';
import { useReliefSystemDetail } from '../hooks/useReliefSystemDetail';
import { useReliefSystemMutations } from '../hooks/useReliefSystemMutations';
import { PsiButton, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { ReliefSystemDetailHeader } from './ReliefSystemDetailHeader';
import { DischargeDestinationTab } from './tabs/DischargeDestinationTab';
import { ProtectedEquipmentTab } from './tabs/ProtectedEquipmentTab';
import { ReliefChangeHistoryTab } from './tabs/ReliefChangeHistoryTab';
import { ReliefConflictsCompletenessTab } from './tabs/ReliefConflictsCompletenessTab';
import { ReliefDeviceProtectionTab } from './tabs/ReliefDeviceProtectionTab';
import { ReliefDocumentsTab } from './tabs/ReliefDocumentsTab';
import { ReliefLinkedRecordsTab } from './tabs/ReliefLinkedRecordsTab';
import { ReliefOverviewTab } from './tabs/ReliefOverviewTab';
import { ReliefReviewApprovalTab } from './tabs/ReliefReviewApprovalTab';
import { ReliefScenariosTab } from './tabs/ReliefScenariosTab';
import { SizingCapacityBasisTab } from './tabs/SizingCapacityBasisTab';

const tabs = [
  'Overview',
  'Protected Equipment',
  'Relief Device / Protection',
  'Relief Scenarios',
  'Sizing / Capacity Basis',
  'Discharge / Destination',
  'Conflicts / Completeness',
  'Linked Records',
  'Documents',
  'Review & Approval',
  'Change History'
] as const;

export function ReliefSystemDetailPage({ reliefBasisId }: { reliefBasisId: string }) {
  const detail = useReliefSystemDetail(reliefBasisId);
  const mutations = useReliefSystemMutations(reliefBasisId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const busy = useMemo(() => mutations.runCompleteness.isPending || mutations.runConflictCheck.isPending || mutations.compareMi.isPending || mutations.submitReview.isPending, [mutations.compareMi.isPending, mutations.runCompleteness.isPending, mutations.runConflictCheck.isPending, mutations.submitReview.isPending]);

  if (detail.isLoading) return <PsiLoadingState rows={8} />;
  if (detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  if (!detail.data) return null;

  const renderTab = () => {
    switch (activeTab) {
      case 'Protected Equipment': return <ProtectedEquipmentTab detail={detail.data} />;
      case 'Relief Device / Protection': return <ReliefDeviceProtectionTab detail={detail.data} />;
      case 'Relief Scenarios': return <ReliefScenariosTab detail={detail.data} />;
      case 'Sizing / Capacity Basis': return <SizingCapacityBasisTab detail={detail.data} />;
      case 'Discharge / Destination': return <DischargeDestinationTab detail={detail.data} />;
      case 'Conflicts / Completeness': return <ReliefConflictsCompletenessTab detail={detail.data} />;
      case 'Linked Records': return <ReliefLinkedRecordsTab detail={detail.data} />;
      case 'Documents': return <ReliefDocumentsTab detail={detail.data} />;
      case 'Review & Approval': return <ReliefReviewApprovalTab detail={detail.data} />;
      case 'Change History': return <ReliefChangeHistoryTab detail={detail.data} />;
      default: return <ReliefOverviewTab detail={detail.data} />;
    }
  };

  return (
    <div className="space-y-5">
      <ReliefSystemDetailHeader
        detail={detail.data}
        busy={busy}
        onRunCompleteness={() => void mutations.runCompleteness.mutateAsync()}
        onRunConflict={() => void mutations.runConflictCheck.mutateAsync()}
        onCompareMi={() => void mutations.compareMi.mutateAsync()}
        onSubmitReview={() => void mutations.submitReview.mutateAsync({ reason: 'Submitted from Relief Systems Design Basis detail tab.' })}
      />
      <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => <PsiButton key={tab} variant={activeTab === tab ? 'primary' : 'secondary'} onClick={() => setActiveTab(tab)}>{tab}</PsiButton>)}
        </div>
      </div>
      {renderTab()}
    </div>
  );
}
