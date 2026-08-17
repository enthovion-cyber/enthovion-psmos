'use client';

import { useDeficiencyDetail, useDeficiencyLookups } from '../hooks/useDeficiencies';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { DeficiencyForm } from './DeficiencyForm';

export function DeficiencyFormPage({ deficiencyId, preset = {} }: { deficiencyId?: string | undefined; preset?: Record<string, unknown> }) {
  const lookups = useDeficiencyLookups();
  const detail = useDeficiencyDetail(deficiencyId);
  if (deficiencyId && detail.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (detail.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load deficiency for editing.</div>;
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Mechanical Integrity</p>
        <h1 className="mt-1 text-2xl font-bold">{deficiencyId ? 'Edit Deficiency' : 'Create Deficiency'}</h1>
      </header>
      <DeficiencyForm detail={detail.data} lookups={lookups.data} preset={preset} />
    </div>
  );
}
