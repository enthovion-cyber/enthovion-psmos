'use client';

import { useMemo, useState } from 'react';
import { useDrawingDetail } from '../hooks/useDrawingDetail';
import { useDrawingMutations } from '../hooks/useDrawingMutations';
import { PsiButton, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { DrawingDetailHeader } from './DrawingDetailHeader';
import { DrawingAsBuiltVerificationTab } from './tabs/DrawingAsBuiltVerificationTab';
import { DrawingChangeHistoryTab } from './tabs/DrawingChangeHistoryTab';
import { DrawingCompletenessConflictsTab } from './tabs/DrawingCompletenessConflictsTab';
import { DrawingDocumentRevisionTab } from './tabs/DrawingDocumentRevisionTab';
import { DrawingDocumentsTab } from './tabs/DrawingDocumentsTab';
import { DrawingLinkedRecordsTab } from './tabs/DrawingLinkedRecordsTab';
import { DrawingMocRedlinesTab } from './tabs/DrawingMocRedlinesTab';
import { DrawingOverviewTab } from './tabs/DrawingOverviewTab';
import { DrawingReviewApprovalTab } from './tabs/DrawingReviewApprovalTab';
import { DrawingScopeTab } from './tabs/DrawingScopeTab';
import { DrawingTagIndexTab } from './tabs/DrawingTagIndexTab';

const tabs = [
  'Overview',
  'Document / Revision',
  'Drawing Scope',
  'Linked Equipment / Records',
  'Tag Index',
  'MOC / Redlines',
  'As-Built Verification',
  'Completeness / Conflicts',
  'Documents',
  'Review & Approval',
  'Change History'
] as const;

export function DrawingDetailPage({ drawingId }: { drawingId: string }) {
  const detail = useDrawingDetail(drawingId);
  const mutations = useDrawingMutations(drawingId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Overview');
  const busy = useMemo(
    () => mutations.runCompleteness.isPending || mutations.runConflictCheck.isPending || mutations.submitReview.isPending,
    [mutations.runCompleteness.isPending, mutations.runConflictCheck.isPending, mutations.submitReview.isPending]
  );

  if (detail.isLoading) return <PsiLoadingState rows={8} />;
  if (detail.isError) return <PsiErrorState message={detail.error.message} onRetry={() => void detail.refetch()} />;
  if (!detail.data) return null;

  const renderTab = () => {
    switch (activeTab) {
      case 'Document / Revision': return <DrawingDocumentRevisionTab detail={detail.data} />;
      case 'Drawing Scope': return <DrawingScopeTab detail={detail.data} />;
      case 'Linked Equipment / Records': return <DrawingLinkedRecordsTab detail={detail.data} />;
      case 'Tag Index': return <DrawingTagIndexTab detail={detail.data} />;
      case 'MOC / Redlines': return <DrawingMocRedlinesTab detail={detail.data} />;
      case 'As-Built Verification': return <DrawingAsBuiltVerificationTab detail={detail.data} />;
      case 'Completeness / Conflicts': return <DrawingCompletenessConflictsTab detail={detail.data} />;
      case 'Documents': return <DrawingDocumentsTab detail={detail.data} />;
      case 'Review & Approval': return <DrawingReviewApprovalTab detail={detail.data} />;
      case 'Change History': return <DrawingChangeHistoryTab detail={detail.data} />;
      default: return <DrawingOverviewTab detail={detail.data} />;
    }
  };

  return (
    <div className="space-y-5">
      <DrawingDetailHeader
        detail={detail.data}
        busy={busy}
        onRunCompleteness={() => void mutations.runCompleteness.mutateAsync()}
        onRunConflict={() => void mutations.runConflictCheck.mutateAsync()}
        onSubmitReview={() => void mutations.submitReview.mutateAsync({ reason: 'Submitted from PSI Drawings / P&IDs detail page.' })}
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
