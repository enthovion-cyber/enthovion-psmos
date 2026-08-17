'use client';

import { useEquipmentHistory } from '../../hooks/useEquipmentHistory';

export function EquipmentHistorySummaryCard({ equipmentId }: { equipmentId: string }) {
  const query = useEquipmentHistory(equipmentId);
  const summary = query.data?.summary ?? {};
  return (
    <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--psm-muted)]">History</p>
      <p className="mt-2 text-2xl font-semibold">{summary.totalEvents ?? 0}</p>
      <p className="text-sm text-[var(--psm-muted)]">Lifecycle and audit events</p>
    </article>
  );
}
