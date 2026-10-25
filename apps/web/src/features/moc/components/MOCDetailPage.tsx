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

const tabs = [
  'Overview',
  'Change Details',
  'Impact Assessment',
  'Risk Ranking',
  'Engineering Package',
  'Closed-Loop Actions',
  'Approval Workflow',
  'Temporary / Emergency Control',
  'PSSR / Startup Readiness',
  'Communication & Training',
  'History',
  'Attachments'
] as const;

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

  if (detail.isLoading) {
    return (
      <div className="space-y-4 p-4 text-[var(--psm-fg)]">
        <LoadingState />
      </div>
    );
  }

  if (detail.isError || !moc) {
    return (
      <div className="space-y-4 p-4 text-[var(--psm-fg)]">
        <ErrorState message="Unable to load MOC detail from API. Please verify the MOC ID or your network connection." />
      </div>
    );
  }

  return (
    <div className="space-y-5 text-[var(--psm-fg)] transition-colors">
      {/* Top Details Header */}
      <MOCHeader
        moc={moc}
        onEdit={() => setTab('Change Details')}
        onUpload={() => setTab('Engineering Package')}
      />

      {/* Lifecycle Progress Stepper */}
      <MOCLifecycleStepper status={moc.status} />

      {/* Responsive Horizontal Tabs Bar */}
      <nav className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2 shadow-sm custom-scrollbar">
        {tabs.map((item) => {
          const isActive = tab === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)] hover:text-[var(--psm-fg)]'
              }`}
            >
              {item}
            </button>
          );
        })}
      </nav>

      {/* Main Workspace Grid: Stacks cleanly below 2xl, side-by-side on 2xl+ */}
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_340px] items-start w-full">
        <div className="min-w-0 space-y-6 w-full">
          {content}
        </div>
        <aside className="w-full space-y-6">
          <MOCSummaryPanel
            moc={moc}
            onTriggerPssr={() =>
              mutations.triggerPssr.mutate({ triggerReason: 'Triggered from summary panel' })
            }
          />
        </aside>
      </div>
    </div>
  );
}
