'use client';

import { useEquipmentHistory } from '../../hooks/useEquipmentHistory';
import { EquipmentHistoryTimeline } from '../../history/EquipmentHistoryTimeline';

export function HistoryTab({ equipmentId }: { equipmentId: string }) {
  const query = useEquipmentHistory(equipmentId);
  if (query.isLoading) return <div className="rounded-xl border border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">Loading equipment history...</div>;
  if (query.error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-200">Unable to load equipment history.</div>;
  return <EquipmentHistoryTimeline data={query.data} />;
}
