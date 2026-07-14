'use client';

import { useMemo, useState } from 'react';
import { MOCHeader } from './MOCHeader';
import { MOCLifecycleStepper } from './MOCLifecycleStepper';
import { MOCSummaryPanel } from './MOCSummaryPanel';
import { ErrorState, LoadingState } from './moc-detail-ui';
import { useMOCDetail } from '../hooks/useMOCDetail';
import { useMOCMutation } from '../hooks/useMOCMutations';
import { MOCOverviewTab } from './tabs/MOCOverviewTab';
import { MOCChangeDetailsTab } from './tabs/MOCChangeDetailsTab';
import { MOCImpactAssessmentTab } from './tabs/MOCImpactAssessmentTab';
import { MOCRiskRankingTab } from './tabs/MOCRiskRankingTab';
import { MOCEngineeringPackageTab } from './tabs/MOCEngineeringPackageTab';
import { MOCClosedLoopActionsTab } from './tabs/MOCClosedLoopActionsTab';
import { MOCApprovalWorkflowTab } from './tabs/MOCApprovalWorkflowTab';
import { MOCTemporaryEmergencyControlTab } from './tabs/MOCTemporaryEmergencyControlTab';
import { MOCPSSRStartupReadinessTab } from './tabs/MOCPSSRStartupReadinessTab';
import { MOCCommunicationTrainingTab } from './tabs/MOCCommunicationTrainingTab';
import { MOCHistoryTab } from './tabs/MOCHistoryTab';
import { MOCAttachmentsTab } from './tabs/MOCAttachmentsTab';

const tabs = ['Overview', 'Change Details', 'Impact Assessment', 'Risk Ranking', 'Engineering Package', 'Closed-Loop Actions', 'Approval Workflow', 'Temporary / Emergency Control', 'PSSR / Startup Readiness', 'Communication & Training', 'History', 'Attachments'] as const;

export function MOCDetailPage({ id }: { id: string }) {
  const detail = useMOCDetail(id);
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const mutations = useMOCMutation(id);
  const moc = detail.data;
  const content = useMemo(() => {
    if (!moc) return null;
    if (tab === 'Overview') return <MOCOverviewTab moc={moc} />;
    if (tab === 'Change Details') return <MOCChangeDetailsTab moc={moc} />;
    if (tab === 'Impact Assessment') return <MOCImpactAssessmentTab moc={moc} />;
    if (tab === 'Risk Ranking') return <MOCRiskRankingTab moc={moc} />;
    if (tab === 'Engineering Package') return <MOCEngineeringPackageTab moc={moc} />;
    if (tab === 'Closed-Loop Actions') return <MOCClosedLoopActionsTab moc={moc} />;
    if (tab === 'Approval Workflow') return <MOCApprovalWorkflowTab moc={moc} />;
    if (tab === 'Temporary / Emergency Control') return <MOCTemporaryEmergencyControlTab moc={moc} />;
    if (tab === 'PSSR / Startup Readiness') return <MOCPSSRStartupReadinessTab moc={moc} />;
    if (tab === 'Communication & Training') return <MOCCommunicationTrainingTab moc={moc} />;
    if (tab === 'History') return <MOCHistoryTab moc={moc} />;
    return <MOCAttachmentsTab moc={moc} />;
  }, [moc, tab]);
  if (detail.isLoading) return <main className="min-h-screen bg-[#020b16] p-6 text-slate-100"><LoadingState /></main>;
  if (detail.isError || !moc) return <main className="min-h-screen bg-[#020b16] p-6 text-slate-100"><ErrorState message="Unable to load MOC detail from API." /></main>;
  return (
    <main className="min-h-screen bg-[#020b16] text-slate-100">
      <MOCHeader moc={moc} onEdit={() => setTab('Change Details')} onUpload={() => setTab('Engineering Package')} />
      <MOCLifecycleStepper status={moc.status} />
      <section className="border-b border-cyan-300/10 bg-[#04101f]/80 px-5 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-md px-3 py-2 text-xs font-black transition ${tab === item ? 'bg-blue-600 text-white' : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:border-blue-300/50'}`}>{item}</button>)}
        </div>
      </section>
      <section className="grid gap-4 p-4 xl:grid-cols-[1fr_360px]">
        <div>{content}</div>
        <MOCSummaryPanel moc={moc} onTriggerPssr={() => mutations.triggerPssr.mutate({ triggerReason: 'Triggered from summary panel' })} />
      </section>
    </main>
  );
}
