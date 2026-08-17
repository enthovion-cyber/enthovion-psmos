'use client';
import { useSafeguardDemands } from '../../hooks/useSafeguardDemands';
import { SectionCard, SafeguardRegisterTable } from '../../safeguards/SafeguardUiPrimitives';
export function SifDemandsTab({ sifId }: { sifId: string }) {
  const query = useSafeguardDemands('sifs', sifId);
  if (query.isLoading) return <SectionCard title="Demand History"><p className="text-sm text-[var(--psm-muted)]">Loading demand history...</p></SectionCard>;
  return <SectionCard title="Demand History" description="Real and spurious demands, success/failure, response time, evidence, and investigation triggers."><SafeguardRegisterTable rows={(query.data as any)?.rows} kind="SIF demand" /></SectionCard>;
}
