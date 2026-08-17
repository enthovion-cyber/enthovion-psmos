'use client';

import { useState } from 'react';
import { useSafeOperatingLimitDetail } from '../hooks/useSafeOperatingLimitDetail';
import { useSafeOperatingLimitMutations } from '../hooks/useSafeOperatingLimitMutations';
import { PsiButton, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { SafeOperatingLimitDetailHeader } from './SafeOperatingLimitDetailHeader';
import { ControlsSafeguardsTab } from './tabs/ControlsSafeguardsTab';
import { DeviationConsequencesTab } from './tabs/DeviationConsequencesTab';
import { LimitChangeHistoryTab } from './tabs/LimitChangeHistoryTab';
import { LimitDocumentsTab } from './tabs/LimitDocumentsTab';
import { LimitLinkedRecordsTab } from './tabs/LimitLinkedRecordsTab';
import { LimitOverviewTab } from './tabs/LimitOverviewTab';
import { LimitReviewApprovalTab } from './tabs/LimitReviewApprovalTab';
import { LimitValuesTab } from './tabs/LimitValuesTab';
import { OperatorResponseTab } from './tabs/OperatorResponseTab';

const tabs = ['Overview', 'Limit Values', 'Consequences of Deviation', 'Operator Response', 'Controls / Safeguards', 'Linked Records', 'Documents', 'Review & Approval', 'Change History'] as const;

export function SafeOperatingLimitDetailPage({ limitId }: { limitId: string }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const query = useSafeOperatingLimitDetail(limitId);
  const mutations = useSafeOperatingLimitMutations(limitId);
  if (query.isLoading) return <PsiLoadingState rows={9} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  const detail = query.data;
  const busy = mutations.runCompleteness.isPending || mutations.runConflictCheck.isPending || mutations.submitReview.isPending;
  const content = tab === 'Limit Values' ? <LimitValuesTab detail={detail} /> : tab === 'Consequences of Deviation' ? <DeviationConsequencesTab detail={detail} /> : tab === 'Operator Response' ? <OperatorResponseTab detail={detail} /> : tab === 'Controls / Safeguards' ? <ControlsSafeguardsTab detail={detail} /> : tab === 'Linked Records' ? <LimitLinkedRecordsTab detail={detail} /> : tab === 'Documents' ? <LimitDocumentsTab detail={detail} /> : tab === 'Review & Approval' ? <LimitReviewApprovalTab detail={detail} /> : tab === 'Change History' ? <LimitChangeHistoryTab detail={detail} /> : <LimitOverviewTab detail={detail} />;
  return (
    <div className="space-y-5">
      <SafeOperatingLimitDetailHeader detail={detail} onRunCompleteness={() => mutations.runCompleteness.mutate()} onRunConflict={() => mutations.runConflictCheck.mutate()} onSubmitReview={() => mutations.submitReview.mutate({ reason: 'Submitted from Safe Operating Limit detail.' })} busy={busy} />
      <div className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">{tabs.map((item) => <PsiButton key={item} variant={item === tab ? 'primary' : 'secondary'} onClick={() => setTab(item)}>{item}</PsiButton>)}</div>
      {content}
    </div>
  );
}
