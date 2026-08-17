'use client';

import { useEquipmentHistory } from '@/features/mechanical-integrity/hooks/useEquipmentHistory';
import { MiHistoryHeader } from '@/features/mechanical-integrity/history/MiHistoryHeader';
import { EquipmentHistoryTimeline } from '@/features/mechanical-integrity/history/EquipmentHistoryTimeline';

export default function Page({ params }: { params: { id: string } }) {
  const query = useEquipmentHistory(params.id);
  if (query.isLoading) return <div className="p-6">Loading equipment history...</div>;
  if (query.error) return <div className="m-6 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-200">Unable to load equipment history.</div>;
  return <main className="space-y-5 p-4 lg:p-6"><MiHistoryHeader title="Equipment History" lastUpdated={query.data?.lastUpdated} onRefresh={() => void query.refetch()} /><EquipmentHistoryTimeline data={query.data} /></main>;
}
