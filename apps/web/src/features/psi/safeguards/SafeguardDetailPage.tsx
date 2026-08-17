'use client';

import { useMemo, useState } from 'react';
import { useSafeguardDetail } from '../hooks/useSafeguardDetail';
import { useSafeguardMutations } from '../hooks/useSafeguardMutations';
import { PsiButton, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { SafeguardDetailHeader } from './SafeguardDetailHeader';
import { SafeguardChangeHistoryTab } from './tabs/SafeguardChangeHistoryTab';
import { SafeguardCompletenessConflictsTab } from './tabs/SafeguardCompletenessConflictsTab';
import { SafeguardDocumentsTab } from './tabs/SafeguardDocumentsTab';
import { SafeguardEffectivenessTab } from './tabs/SafeguardEffectivenessTab';
import { SafeguardFunctionRequirementsTab } from './tabs/SafeguardFunctionRequirementsTab';
import { SafeguardHazardScenarioTab } from './tabs/SafeguardHazardScenarioTab';
import { SafeguardLinkedRecordsTab } from './tabs/SafeguardLinkedRecordsTab';
import { SafeguardOverviewTab } from './tabs/SafeguardOverviewTab';
import { SafeguardReviewApprovalTab } from './tabs/SafeguardReviewApprovalTab';
import { SafeguardSourceModuleTab } from './tabs/SafeguardSourceModuleTab';
import { SafeguardTestingImpairmentTab } from './tabs/SafeguardTestingImpairmentTab';

const tabs = ['Overview', 'Hazard / Scenario Controlled', 'Function & Requirements', 'Source Module Link', 'Effectiveness / Independence', 'Testing / Monitoring / Impairment', 'Documents / Evidence', 'Completeness / Conflicts', 'Linked Records', 'Review & Approval', 'Change History'] as const;

export function SafeguardDetailPage({ safeguardId }: { safeguardId: string }) {
  const detail = useSafeguardDetail(safeguardId);
  const mutations = useSafeguardMutations(safeguardId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const busy = useMemo(() => mutations.runSourceStatusCheck.isPending || mutations.runCompleteness.isPending || mutations.runConflictCheck.isPending || mutations.submitReview.isPending, [mutations.runSourceStatusCheck.isPending, mutations.runCompleteness.isPending, mutations.runConflictCheck.isPending, mutations.submitReview.isPending]);
  if (detail.isLoading) return <PsiLoadingState rows={8} />;
  if (detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  if (!detail.data) return null;
  const renderTab = () => {
    switch (activeTab) {
      case 'Hazard / Scenario Controlled': return <SafeguardHazardScenarioTab detail={detail.data} />;
      case 'Function & Requirements': return <SafeguardFunctionRequirementsTab detail={detail.data} />;
      case 'Source Module Link': return <SafeguardSourceModuleTab detail={detail.data} />;
      case 'Effectiveness / Independence': return <SafeguardEffectivenessTab detail={detail.data} />;
      case 'Testing / Monitoring / Impairment': return <SafeguardTestingImpairmentTab detail={detail.data} />;
      case 'Documents / Evidence': return <SafeguardDocumentsTab detail={detail.data} />;
      case 'Completeness / Conflicts': return <SafeguardCompletenessConflictsTab detail={detail.data} />;
      case 'Linked Records': return <SafeguardLinkedRecordsTab detail={detail.data} />;
      case 'Review & Approval': return <SafeguardReviewApprovalTab detail={detail.data} busy={busy} onSubmitReview={() => void mutations.submitReview.mutateAsync({ reason: 'Submitted from PSI safeguards detail.' })} />;
      case 'Change History': return <SafeguardChangeHistoryTab detail={detail.data} />;
      default: return <SafeguardOverviewTab detail={detail.data} />;
    }
  };
  return <div className="space-y-5"><SafeguardDetailHeader detail={detail.data} busy={busy} onRunSourceStatus={() => void mutations.runSourceStatusCheck.mutateAsync()} onRunCompleteness={() => void mutations.runCompleteness.mutateAsync()} onRunConflict={() => void mutations.runConflictCheck.mutateAsync()} onSubmitReview={() => void mutations.submitReview.mutateAsync({ reason: 'Submitted from PSI safeguards detail.' })} /><div className="overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2"><div className="flex min-w-max gap-2">{tabs.map((tab) => <PsiButton key={tab} variant={activeTab === tab ? 'primary' : 'secondary'} onClick={() => setActiveTab(tab)}>{tab}</PsiButton>)}</div></div>{renderTab()}</div>;
}
