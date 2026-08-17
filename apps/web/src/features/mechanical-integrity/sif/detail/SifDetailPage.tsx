'use client';

import { useMemo, useState } from 'react';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { useSifDetail, useSifMutations } from '../../hooks/useSifs';
import { SifBypassHistoryTab } from '../tabs/SifBypassHistoryTab';
import { SifDemandsTab } from '../tabs/SifDemandsTab';
import { SifDevicesTab } from '../tabs/SifDevicesTab';
import { SifHistoryTab } from '../tabs/SifHistoryTab';
import { SifLopaSilLinksTab } from '../tabs/SifLopaSilLinksTab';
import { SifOverviewTab } from '../tabs/SifOverviewTab';
import { SifProofTestsTab } from '../tabs/SifProofTestsTab';
import { SifDetailHeader } from './SifDetailHeader';

const tabs = ['Overview', 'Devices', 'Proof Tests', 'Demands', 'Bypass History', 'LOPA/SIL Links', 'History'] as const;

export function SifDetailPage({ sifId }: { sifId: string }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const query = useSifDetail(sifId);
  const mutations = useSifMutations();
  const data = query.data as any;
  const sif = data?.sif ?? data?.record;
  const content = useMemo(() => {
    if (!data) return null;
    if (tab === 'Devices') return <SifDevicesTab sifId={sifId} devices={data.devices} />;
    if (tab === 'Proof Tests') return <SifProofTestsTab sifId={sifId} testRequirements={data.testRequirements} />;
    if (tab === 'Demands') return <SifDemandsTab sifId={sifId} />;
    if (tab === 'Bypass History') return <SifBypassHistoryTab sifId={sifId} foundation={data.bypassFoundation} />;
    if (tab === 'LOPA/SIL Links') return <SifLopaSilLinksTab sifId={sifId} link={data.lopaSil} silData={data.silData} />;
    if (tab === 'History') return <SifHistoryTab events={data.history} />;
    return <SifOverviewTab data={data} />;
  }, [data, sifId, tab]);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !sif) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">SIF detail could not be loaded.</div>;
  return (
    <div className="space-y-5">
      <SifDetailHeader sif={sif} onRecalculate={() => mutations.recalculateSchedule.mutate(sifId)} recalculating={mutations.recalculateSchedule.isPending} />
      <nav className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-2">
        {tabs.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${tab === item ? 'bg-primary text-primary-foreground' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]'}`}>{item}</button>
        ))}
      </nav>
      {content}
    </div>
  );
}
