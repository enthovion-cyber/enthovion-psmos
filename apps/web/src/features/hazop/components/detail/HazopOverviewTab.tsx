'use client';

import { useHazopOverview } from '../../hooks/useHazopOverview';
import { HazopStudyHeader } from '../overview/HazopStudyHeader';
import { HazopOverviewKpiCards } from '../overview/HazopOverviewKpiCards';
import { HazopStudyOverviewCard } from '../overview/HazopStudyOverviewCard';
import { HazopStudyProgressCard } from '../overview/HazopStudyProgressCard';
import { HazopRiskSnapshotCard } from '../overview/HazopRiskSnapshotCard';
import { HazopTeamSnapshotCard } from '../overview/HazopTeamSnapshotCard';
import { HazopRecommendationsPreview } from '../overview/HazopRecommendationsPreview';
import { HazopLinkedRecordsPreview } from '../overview/HazopLinkedRecordsPreview';
import { HazopRecentActivityTimeline } from '../overview/HazopRecentActivityTimeline';
import { HazopAttachmentsPreview } from '../overview/HazopAttachmentsPreview';
import { HazopReviewReadinessCard } from '../overview/HazopReviewReadinessCard';
import { HazopEquipmentProcessContext } from '../overview/HazopEquipmentProcessContext';
import { HazopQuickActions } from '../overview/HazopQuickActions';

export function HazopOverviewTab({ study, onNavigate }: { study: any; onNavigate: (tab?: string) => void }) {
  const query = useHazopOverview(study.id);
  const data = query.data;
  if (query.isLoading) return <Skeleton />;
  if (query.isError) return <State title="Unable to load Overview" text="The HAZOP overview API rejected the request or is unavailable." tone="text-red-300" />;
  if (!data) return <State title="No overview data" text="No Overview data was returned for this study." />;
  return (
    <div className="space-y-4">
      <HazopStudyHeader header={data.header} permissions={data.permissions} />
      <HazopOverviewKpiCards kpis={data.kpis} onNavigate={onNavigate} />
      {data.header?.readOnly ? <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200">This HAZOP study is closed or approved. Overview is read-only unless an authorized user reopens it.</div> : null}
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
        <HazopStudyOverviewCard overview={data.overview} />
        <HazopStudyProgressCard progress={data.progress} onNavigate={onNavigate} />
        <HazopRiskSnapshotCard riskSnapshot={data.riskSnapshot} onNavigate={onNavigate} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.08fr]">
        <HazopTeamSnapshotCard teamSnapshot={data.teamSnapshot} onNavigate={onNavigate} />
        <HazopRecommendationsPreview preview={data.recommendationsPreview} canCreate={data.permissions.canCreateRecommendation} onNavigate={onNavigate} />
        <HazopLinkedRecordsPreview preview={data.linkedRecordsPreview} onNavigate={onNavigate} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        
        <HazopRecentActivityTimeline events={data.recentActivity} onNavigate={onNavigate} />
        <HazopAttachmentsPreview preview={data.attachmentsPreview} canDownload={data.permissions.canDownloadAttachment} onNavigate={onNavigate} />
        <HazopQuickActions studyId={study.id} actions={data.quickActions} onNavigate={onNavigate} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
        <HazopReviewReadinessCard readiness={data.readiness} onNavigate={onNavigate} />
         <HazopEquipmentProcessContext context={data.equipmentContext} onNavigate={onNavigate} />
      </div>
     
    </div>
  );
}

function Skeleton() {
  return <div className="grid gap-4"><div className="h-28 animate-pulse rounded-xl bg-white/5" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-white/5" />)}</div><div className="h-96 animate-pulse rounded-xl bg-white/5" /></div>;
}

function State({ title, text, tone = 'text-[var(--psm-muted)]' }: { title: string; text: string; tone?: string }) {
  return <div className={`rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center ${tone}`}><div className="text-lg font-semibold">{title}</div><p className="mt-2 text-sm">{text}</p></div>;
}
