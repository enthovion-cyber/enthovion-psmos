'use client';

import { useState } from 'react';
import { useLopaOverview } from '../../hooks/useLopaOverview';
import { useLopaStudyMutations } from '../../hooks/useLopaStudyMutations';
import { LopaComingSoonTab, LopaDetailTabs, lopaDetailTabs } from './LopaDetailTabs';
import { LopaDetailHeader } from './LopaDetailHeader';
import { LopaIplsSafeguardsTab } from './LopaIplsSafeguardsTab';
import { LopaAttachmentsTab } from './LopaAttachmentsTab';
import { LopaFinalReportTab } from './LopaFinalReportTab';
import { LopaHistoryTab } from './LopaHistoryTab';
import { LopaInitiatingEventTab } from './LopaInitiatingEventTab';
import { LopaLinkedRecordsTab } from './LopaLinkedRecordsTab';
import { LopaOverviewTab } from './LopaOverviewTab';
import { LopaRecommendationsActionsTab } from './LopaRecommendationsActionsTab';
import { LopaRiskCalculationTab } from './LopaRiskCalculationTab';
import { LopaSilDeterminationTab } from './LopaSilDeterminationTab';
import { LopaReviewSignoffTab } from './LopaReviewSignoffTab';
import { LopaScenarioConsequenceTab } from './LopaScenarioConsequenceTab';
import { LopaTeamSessionsTab } from './LopaTeamSessionsTab';

export function LopaDetailPage({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState('overview');
  const overviewQuery = useLopaOverview(id);
  const mutations = useLopaStudyMutations(id);
  const overview = overviewQuery.data;
  const isBusy = mutations.update.isPending || mutations.cancel.isPending || mutations.reopen.isPending || mutations.syncHazop.isPending;

  function editTitle() {
    if (!overview) return;
    const title = window.prompt('Update LOPA study title', overview.header.title);
    if (!title || title === overview.header.title) return;
    mutations.update.mutate({ title });
  }

  function cancelStudy() {
    const reason = window.prompt('Reason for cancelling this LOPA study');
    if (!reason) return;
    mutations.cancel.mutate(reason);
  }

  function reopenStudy() {
    const reason = window.prompt('Reason for reopening this LOPA study');
    if (!reason) return;
    mutations.reopen.mutate(reason);
  }

  if (overviewQuery.isLoading) return <State text="Loading LOPA study detail from API..." />;
  if (overviewQuery.isError) return <State text="Unable to load LOPA study. It may be missing, restricted, or your session may not have permission." tone="error" />;
  if (!overview) return <State text="LOPA study not found." tone="error" />;

  const activeLabel = lopaDetailTabs.find(([key]) => key === activeTab)?.[1] ?? 'Overview';
  const indicators = {
    scenario: overview.consequence?.completionStatus === 'Complete' ? undefined : '!',
    'initiating-event': overview.initiatingEvent?.completionStatus === 'Complete' ? undefined : '!',
    ipls: overview.safeguards.validationNotStarted || overview.safeguards.validationFailed || undefined,
    'risk-calculation': overview.calculation.status === 'Complete' ? undefined : '!',
    sil: overview.sil.silGapStatus && String(overview.sil.silGapStatus).toLowerCase().includes('gap') ? 'Gap' : undefined,
    actions: overview.header.openActions || undefined,
    'team-sessions': overview.header.openActions || undefined,
    review: overview.blockers.length || undefined
  };

  return (
    <main className="space-y-4 pb-8 text-slate-100">
      <style jsx global>{`
        .lopa-button-primary { display:inline-flex; align-items:center; gap:.45rem; border-radius:.55rem; background:#2563eb; padding:.58rem .85rem; font-size:.82rem; font-weight:700; color:white; box-shadow:0 18px 40px rgba(37,99,235,.18); }
        .lopa-button-primary:hover { background:#3b82f6; }
        .lopa-button-secondary { display:inline-flex; align-items:center; gap:.45rem; border-radius:.55rem; border:1px solid rgba(103,232,249,.14); background:rgba(15,35,58,.9); padding:.55rem .8rem; font-size:.82rem; font-weight:700; color:#dbeafe; }
        .lopa-button-secondary:hover { border-color:rgba(96,165,250,.35); background:rgba(37,99,235,.12); }
      `}</style>
      <LopaDetailHeader overview={overview} onRefresh={() => void overviewQuery.refetch()} onEditTitle={editTitle} onCancel={cancelStudy} onReopen={reopenStudy} onStartReview={() => setActiveTab('review')} isBusy={isBusy} />
      {mutations.update.isError || mutations.cancel.isError || mutations.reopen.isError || mutations.syncHazop.isError ? <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">LOPA action failed. Check required permission, status, or backend validation.</div> : null}
      <LopaDetailTabs active={activeTab} onChange={setActiveTab} indicators={indicators} />
      {activeTab === 'overview' ? <LopaOverviewTab overview={overview} onSyncHazop={() => mutations.syncHazop.mutate()} isSyncing={mutations.syncHazop.isPending} onSelectTab={(tab) => tab && setActiveTab(tab)} /> : null}
      {activeTab === 'scenario' ? <LopaScenarioConsequenceTab id={id} onSelectTab={(tab) => tab && setActiveTab(tab)} /> : null}
      {activeTab === 'initiating-event' ? <LopaInitiatingEventTab id={id} onSelectTab={(tab) => tab && setActiveTab(tab)} /> : null}
      {activeTab === 'ipls' ? <LopaIplsSafeguardsTab id={id} /> : null}
      {activeTab === 'risk-calculation' ? <LopaRiskCalculationTab id={id} /> : null}
      {activeTab === 'sil' ? <LopaSilDeterminationTab id={id} /> : null}
      {activeTab === 'actions' ? <LopaRecommendationsActionsTab id={id} /> : null}
      {activeTab === 'team-sessions' ? <LopaTeamSessionsTab id={id} /> : null}
      {activeTab === 'linked-records' ? <LopaLinkedRecordsTab id={id} /> : null}
      {activeTab === 'review' ? <LopaReviewSignoffTab id={id} onSelectTab={setActiveTab} /> : null}
      {activeTab === 'attachments' ? <LopaAttachmentsTab id={id} /> : null}
      {activeTab === 'history' ? <LopaHistoryTab id={id} /> : null}
      {activeTab === 'final-report' ? <LopaFinalReportTab id={id} /> : null}
      {!['overview', 'scenario', 'initiating-event', 'ipls', 'risk-calculation', 'sil', 'actions', 'team-sessions', 'linked-records', 'review', 'attachments', 'history', 'final-report'].includes(activeTab) ? <LopaComingSoonTab title={activeLabel} /> : null}
    </main>
  );
}

function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) {
  return <main className={`rounded-xl border p-6 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-cyan-300/10 bg-[#071525] text-slate-400'}`}>{text}</main>;
}
