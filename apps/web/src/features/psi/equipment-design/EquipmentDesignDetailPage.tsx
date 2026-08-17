'use client';

import { useMemo, useState } from 'react';
import { EquipmentDesignDetailHeader } from './EquipmentDesignDetailHeader';
import { PsiButton, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { useEquipmentDesignDetail } from '../hooks/useEquipmentDesignDetail';
import { useEquipmentDesignMutations } from '../hooks/useEquipmentDesignMutations';
import { AssumptionsLimitationsTab } from './tabs/AssumptionsLimitationsTab';
import { CapacityPerformanceTab } from './tabs/CapacityPerformanceTab';
import { CodesStandardsTab } from './tabs/CodesStandardsTab';
import { DesignConflictsCompletenessTab } from './tabs/DesignConflictsCompletenessTab';
import { DesignRatingsTab } from './tabs/DesignRatingsTab';
import { EquipmentDesignChangeHistoryTab } from './tabs/EquipmentDesignChangeHistoryTab';
import { EquipmentDesignDocumentsTab } from './tabs/EquipmentDesignDocumentsTab';
import { EquipmentDesignLinkedRecordsTab } from './tabs/EquipmentDesignLinkedRecordsTab';
import { EquipmentDesignOverviewTab } from './tabs/EquipmentDesignOverviewTab';
import { EquipmentDesignReviewApprovalTab } from './tabs/EquipmentDesignReviewApprovalTab';
import { MechanicalMaterialBasisTab } from './tabs/MechanicalMaterialBasisTab';
import { ServiceOperatingBasisTab } from './tabs/ServiceOperatingBasisTab';

const tabs = [
  'Overview',
  'Design Ratings',
  'Service / Operating Basis',
  'Mechanical / Material Basis',
  'Capacity / Performance',
  'Codes / Standards',
  'Assumptions / Limitations',
  'Conflicts / Completeness',
  'Linked Records',
  'Documents',
  'Review & Approval',
  'Change History'
] as const;

export function EquipmentDesignDetailPage({ designBasisId }: { designBasisId: string }) {
  const detail = useEquipmentDesignDetail(designBasisId);
  const mutations = useEquipmentDesignMutations(designBasisId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const busy = useMemo(() => mutations.runCompleteness.isPending || mutations.runConflictCheck.isPending || mutations.compareMi.isPending || mutations.submitReview.isPending, [mutations.compareMi.isPending, mutations.runCompleteness.isPending, mutations.runConflictCheck.isPending, mutations.submitReview.isPending]);

  if (detail.isLoading) return <PsiLoadingState rows={8} />;
  if (detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  if (!detail.data) return null;

  const renderTab = () => {
    switch (activeTab) {
      case 'Design Ratings': return <DesignRatingsTab detail={detail.data} />;
      case 'Service / Operating Basis': return <ServiceOperatingBasisTab detail={detail.data} />;
      case 'Mechanical / Material Basis': return <MechanicalMaterialBasisTab detail={detail.data} />;
      case 'Capacity / Performance': return <CapacityPerformanceTab detail={detail.data} />;
      case 'Codes / Standards': return <CodesStandardsTab detail={detail.data} />;
      case 'Assumptions / Limitations': return <AssumptionsLimitationsTab detail={detail.data} />;
      case 'Conflicts / Completeness': return <DesignConflictsCompletenessTab detail={detail.data} />;
      case 'Linked Records': return <EquipmentDesignLinkedRecordsTab detail={detail.data} />;
      case 'Documents': return <EquipmentDesignDocumentsTab detail={detail.data} />;
      case 'Review & Approval': return <EquipmentDesignReviewApprovalTab detail={detail.data} />;
      case 'Change History': return <EquipmentDesignChangeHistoryTab detail={detail.data} />;
      default: return <EquipmentDesignOverviewTab detail={detail.data} />;
    }
  };

  return (
    <div className="space-y-5">
      <EquipmentDesignDetailHeader
        detail={detail.data}
        busy={busy}
        onRunCompleteness={() => void mutations.runCompleteness.mutateAsync()}
        onRunConflict={() => void mutations.runConflictCheck.mutateAsync()}
        onCompareMi={() => void mutations.compareMi.mutateAsync()}
        onSubmitReview={() => void mutations.submitReview.mutateAsync({ reason: 'Submitted from Equipment Design Basis detail tab.' })}
      />
      <div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => (
            <PsiButton key={tab} variant={activeTab === tab ? 'primary' : 'secondary'} onClick={() => setActiveTab(tab)}>{tab}</PsiButton>
          ))}
        </div>
      </div>
      {renderTab()}
    </div>
  );
}
