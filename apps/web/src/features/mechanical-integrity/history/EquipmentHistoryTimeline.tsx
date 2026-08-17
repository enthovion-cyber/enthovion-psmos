'use client';

import { MiHistorySummaryCards } from './MiHistorySummaryCards';
import { MiHistoryTimeline } from './MiHistoryTimeline';
import type { MiEquipmentHistory } from '../types/mi-history.types';

export function EquipmentHistoryTimeline({ data }: { data?: MiEquipmentHistory | undefined }) {
  if (!data) {
    return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-8 text-center text-sm text-[var(--psm-muted)]">Equipment history is loading or unavailable.</div>;
  }

  return (
    <div className="space-y-4">
      <MiHistorySummaryCards summary={data.summary} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Lifecycle timeline" rows={data.lifecycleTimeline} />
        <Panel title="Integrity events" rows={data.integrityEvents} />
        <Panel title="Inspection and CML timeline" rows={data.inspectionCmlTimeline} />
        <Panel title="PM, calibration, PSV, SIF, safeguards" rows={[...data.pmCalibrationTimeline, ...data.psvSifSafeguardTimeline]} />
        <Panel title="Deficiency and work order timeline" rows={data.deficiencyWorkTimeline} />
        <Panel title="Readiness, approval, documents" rows={[...data.readinessApprovalTimeline, ...data.documentTimeline]} />
      </div>
    </div>
  );
}

function Panel({ title, rows }: { title: string; rows: MiEquipmentHistory['rows'] }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <MiHistoryTimeline rows={rows} />
    </section>
  );
}
