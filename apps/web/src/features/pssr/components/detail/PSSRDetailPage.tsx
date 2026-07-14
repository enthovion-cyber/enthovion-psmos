'use client';

import { useState } from 'react';
import { usePSSRDetail } from '../../hooks/usePSSRDetail';
import { usePSSRMutations } from '../../hooks/usePSSRMutations';
import { EmptyState, ErrorState, LoadingState } from '../pssr-ui';
import { PSSRHeader } from './PSSRHeader';
import { PSSRLifecycleStepper } from './PSSRLifecycleStepper';
import { PSSRSummaryPanel } from './PSSRSummaryPanel';
import { PSSROverviewTab } from '../tabs/PSSROverviewTab';
import { PSSRChecklistVerificationTab } from '../tabs/PSSRChecklistVerificationTab';
import { PSSREquipmentFieldVerificationTab } from '../tabs/PSSREquipmentFieldVerificationTab';
import { PSSRDocumentReadinessTab } from '../tabs/PSSRDocumentReadinessTab';
import { PSSRTrainingPersonnelReadinessTab } from '../tabs/PSSRTrainingPersonnelReadinessTab';
import { PSSRTestingCommissioningTab } from '../tabs/PSSRTestingCommissioningTab';
import { PSSRPunchListActionsTab } from '../tabs/PSSRPunchListActionsTab';
import { PSSRStartupAuthorizationTab } from '../tabs/PSSRStartupAuthorizationTab';
import { PSSRHistoryTab } from '../tabs/PSSRHistoryTab';
import { PSSRAttachmentsTab } from '../tabs/PSSRAttachmentsTab';

const tabs = ['Overview', 'Checklist & Verification', 'Equipment & Field Verification', 'Document Readiness', 'Training & Personnel Readiness', 'Testing & Commissioning', 'Punch List / Actions', 'Startup Authorization', 'History', 'Attachments'];

export function PSSRDetailPage({ id }: { id: string }) {
  const query = usePSSRDetail(id);
  const mutations = usePSSRMutations(id);
  const [tab, setTab] = useState('Overview');
  if (query.isLoading) return <main className="min-h-screen bg-[#020b16] p-5 text-white"><LoadingState /></main>;
  if (query.isError) return <main className="min-h-screen bg-[#020b16] p-5 text-white"><ErrorState message="Unable to load PSSR detail." /></main>;
  const pssr = query.data;
  if (!pssr) return <main className="min-h-screen bg-[#020b16] p-5 text-white"><EmptyState title="PSSR not found" /></main>;
  const content: Record<string, any> = {
    'Overview': <PSSROverviewTab pssr={pssr} />,
    'Checklist & Verification': <PSSRChecklistVerificationTab pssr={pssr} />,
    'Equipment & Field Verification': <PSSREquipmentFieldVerificationTab pssr={pssr} />,
    'Document Readiness': <PSSRDocumentReadinessTab pssr={pssr} />,
    'Training & Personnel Readiness': <PSSRTrainingPersonnelReadinessTab pssr={pssr} />,
    'Testing & Commissioning': <PSSRTestingCommissioningTab pssr={pssr} />,
    'Punch List / Actions': <PSSRPunchListActionsTab pssr={pssr} />,
    'Startup Authorization': <PSSRStartupAuthorizationTab pssr={pssr} />,
    'History': <PSSRHistoryTab pssr={pssr} />,
    'Attachments': <PSSRAttachmentsTab pssr={pssr} />
  };
  return (
    <main className="min-h-screen bg-[#020b16] p-4 text-slate-100 sm:p-5">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <PSSRHeader pssr={pssr} onReadiness={() => mutations.readinessCheck.mutate()} busy={mutations.readinessCheck.isPending} />
        <PSSRLifecycleStepper status={pssr.status} />
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <section className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-2"><div className="flex min-w-[1080px] gap-1">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-xs font-black ${tab === item ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'}`}>{item}</button>)}</div></div>
            {content[tab]}
          </section>
          <PSSRSummaryPanel pssr={pssr} onTransition={(action) => mutations.transition.mutate(action)} onGenerateChecklist={() => mutations.generateChecklist.mutate()} onSyncMoc={() => mutations.syncLinkedMoc.mutate()} />
        </div>
      </div>
    </main>
  );
}
