'use client';

import { useRouter } from 'next/navigation';
import { useEquipmentCriticality } from '../../hooks/useEquipmentCriticality';
import { MiLoadingSkeleton } from '../../shared/MiLoadingSkeleton';
import { ConsequenceSummaryCard } from './ConsequenceSummaryCard';
import { CriticalityHistoryTimeline } from './CriticalityHistoryTimeline';
import { CurrentCriticalitySummary } from './CurrentCriticalitySummary';
import { IntegrityDriversCard } from './IntegrityDriversCard';
import { LikelihoodSummaryCard } from './LikelihoodSummaryCard';
import { RiskScoreBreakdown } from './RiskScoreBreakdown';

export function EquipmentCriticalityPage({ equipmentId }: { equipmentId: string }) {
  const router = useRouter();
  const query = useEquipmentCriticality(equipmentId);
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Equipment criticality could not be loaded.</div>;
  const data = query.data;
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 md:flex-row md:items-center md:justify-between"><div><h1 className="text-xl font-semibold">Criticality / Risk Ranking</h1><p className="text-sm text-muted-foreground">Current approved criticality, backend snapshot drivers, and assessment history.</p></div><button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground" onClick={() => router.push(`/mechanical-integrity/equipment/${equipmentId}/criticality/new`)}>New Assessment</button></div>
      <CurrentCriticalitySummary current={data.current} />
      <div className="grid gap-4 md:grid-cols-3"><ConsequenceSummaryCard value={data.current?.consequence_score} /><LikelihoodSummaryCard value={data.current?.likelihood_score} /><RiskScoreBreakdown current={data.current} /></div>
      <IntegrityDriversCard snapshot={data.snapshot} />
      <CriticalityHistoryTimeline rows={data.history} />
    </div>
  );
}
