'use client';

import { useState } from 'react';
import { useCmlInspectionReadings } from '../hooks/useUtReadings';
import { useInspectionRecordMutations } from '../hooks/useInspectionRecordMutations';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { InspectionReadingsEntrySection } from '../inspection-records/sections/InspectionReadingsEntrySection';

export function UtReadingsPage({ equipmentId, cmlId }: { equipmentId: string; cmlId: string }) {
  const query = useCmlInspectionReadings(equipmentId, cmlId);
  const mutations = useInspectionRecordMutations(undefined, equipmentId);
  const [error, setError] = useState<string | null>(null);
  if (query.isLoading) return <MiLoadingSkeleton rows={5} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">UT readings could not be loaded.</div>;
  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">CML / TML</p><h1 className="text-2xl font-bold text-[var(--psm-text)]">UT Reading History</h1><p className="text-sm text-[var(--psm-muted)]">Official readings are approved through inspection records and drive remaining-life calculations.</p></header>
      {error ? <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div> : null}
      <InspectionReadingsEntrySection rows={query.data} onAdd={(input) => {
        setError('Standalone CML reading entry requires an inspection record context. Create or open an inspection record to submit this reading with audit history.');
      }} saving={mutations.addReading.isPending} />
    </div>
  );
}
