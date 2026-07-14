'use client';

import { AffectedEquipmentCard } from '../overview/AffectedEquipmentCard';
import { LinkedMOCCard } from '../overview/LinkedMOCCard';
import { PSSRLatestActivity } from '../overview/PSSRLatestActivity';
import { PSSRSummaryCard } from '../overview/PSSRSummaryCard';
import { PunchListSummaryCard } from '../overview/PunchListSummaryCard';
import { StartupReadinessCard } from '../overview/StartupReadinessCard';
import { PSSRCard } from '../pssr-ui';

export function PSSROverviewTab({ pssr }: { pssr: any }) {
  return (
    <div className="grid gap-4 2xl:grid-cols-2">
      <PSSRSummaryCard pssr={pssr} />
      <StartupReadinessCard pssr={pssr} />
      <LinkedMOCCard pssr={pssr} />
      <AffectedEquipmentCard pssr={pssr} />
      <PunchListSummaryCard pssr={pssr} />
      <PSSRLatestActivity pssr={pssr} />
      <PSSRCard title="Startup Scope">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <TextBlock label="Scope Description" value={pssr.startup_scope?.startupScopeDescription ?? pssr.description} />
          <TextBlock label="What Is Being Started" value={pssr.startup_scope?.whatIsBeingStarted ?? pssr.startup_scope?.whatChanged} />
          <TextBlock label="Startup Boundaries" value={pssr.startup_boundaries} />
          <TextBlock label="Startup Hazards" value={pssr.startup_hazards} />
          <TextBlock label="Prerequisites" value={pssr.startup_prerequisites} />
          <TextBlock label="Temporary Controls" value={pssr.temporary_controls} />
        </div>
      </PSSRCard>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: any }) {
  return <div className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-slate-200">{value || '-'}</p></div>;
}
