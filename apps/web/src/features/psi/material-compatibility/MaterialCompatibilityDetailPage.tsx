'use client';

import { useMemo, useState } from 'react';
import { useMaterialCompatibilityDetail } from '../hooks/useMaterialCompatibilityDetail';
import { useMaterialCompatibilityMutations } from '../hooks/useMaterialCompatibilityMutations';
import { PsiButton, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { MaterialCompatibilityDetailHeader } from './MaterialCompatibilityDetailHeader';
import { ChemicalServiceConditionsTab } from './tabs/ChemicalServiceConditionsTab';
import { CompatibilityChangeHistoryTab } from './tabs/CompatibilityChangeHistoryTab';
import { CompatibilityCompletenessConflictsTab } from './tabs/CompatibilityCompletenessConflictsTab';
import { CompatibilityEvidenceDocumentsTab } from './tabs/CompatibilityEvidenceDocumentsTab';
import { CompatibilityLinkedRecordsTab } from './tabs/CompatibilityLinkedRecordsTab';
import { CompatibilityOverviewTab } from './tabs/CompatibilityOverviewTab';
import { CompatibilityRatingTab } from './tabs/CompatibilityRatingTab';
import { CompatibilityReviewApprovalTab } from './tabs/CompatibilityReviewApprovalTab';
import { ControlsRestrictionsTab } from './tabs/ControlsRestrictionsTab';
import { DegradationMechanismsTab } from './tabs/DegradationMechanismsTab';
import { MaterialComponentDetailsTab } from './tabs/MaterialComponentDetailsTab';

const tabs = ['Overview', 'Chemical / Service Conditions', 'Material / Component Details', 'Compatibility Rating', 'Degradation Mechanisms', 'Controls / Restrictions', 'Evidence / Documents', 'Completeness / Conflicts', 'Linked Records', 'Review & Approval', 'Change History'] as const;

export function MaterialCompatibilityDetailPage({ compatibilityId }: { compatibilityId: string }) {
  const detail = useMaterialCompatibilityDetail(compatibilityId);
  const mutations = useMaterialCompatibilityMutations(compatibilityId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const busy = useMemo(() => mutations.runCompatibilityCheck.isPending || mutations.runCompleteness.isPending || mutations.runConflictCheck.isPending || mutations.submitReview.isPending, [mutations.runCompatibilityCheck.isPending, mutations.runCompleteness.isPending, mutations.runConflictCheck.isPending, mutations.submitReview.isPending]);
  if (detail.isLoading) return <PsiLoadingState rows={8} />;
  if (detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  if (!detail.data) return null;
  const renderTab = () => {
    switch (activeTab) {
      case 'Chemical / Service Conditions': return <ChemicalServiceConditionsTab detail={detail.data} />;
      case 'Material / Component Details': return <MaterialComponentDetailsTab detail={detail.data} />;
      case 'Compatibility Rating': return <CompatibilityRatingTab detail={detail.data} />;
      case 'Degradation Mechanisms': return <DegradationMechanismsTab detail={detail.data} />;
      case 'Controls / Restrictions': return <ControlsRestrictionsTab detail={detail.data} />;
      case 'Evidence / Documents': return <CompatibilityEvidenceDocumentsTab detail={detail.data} />;
      case 'Completeness / Conflicts': return <CompatibilityCompletenessConflictsTab detail={detail.data} />;
      case 'Linked Records': return <CompatibilityLinkedRecordsTab detail={detail.data} />;
      case 'Review & Approval': return <CompatibilityReviewApprovalTab detail={detail.data} />;
      case 'Change History': return <CompatibilityChangeHistoryTab detail={detail.data} />;
      default: return <CompatibilityOverviewTab detail={detail.data} />;
    }
  };
  return <div className="space-y-5"><MaterialCompatibilityDetailHeader detail={detail.data} busy={busy} onRunCompatibilityCheck={() => void mutations.runCompatibilityCheck.mutateAsync()} onRunCompleteness={() => void mutations.runCompleteness.mutateAsync()} onRunConflict={() => void mutations.runConflictCheck.mutateAsync()} onSubmitReview={() => void mutations.submitReview.mutateAsync({ reason: 'Submitted from PSI material compatibility detail.' })} /><div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2"><div className="flex min-w-max gap-2">{tabs.map((tab) => <PsiButton key={tab} variant={activeTab === tab ? 'primary' : 'secondary'} onClick={() => setActiveTab(tab)}>{tab}</PsiButton>)}</div></div>{renderTab()}</div>;
}

