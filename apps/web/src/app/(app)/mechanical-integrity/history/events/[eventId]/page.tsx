'use client';

import { useQuery } from '@tanstack/react-query';
import { miHistoryService } from '@/features/mechanical-integrity/services/mi-history.service';
import { HistoryEventDetailDrawer } from '@/features/mechanical-integrity/history/HistoryEventDetailDrawer';

export default function Page({ params }: { params: { eventId: string } }) {
  const query = useQuery({ queryKey: ['mechanical-integrity', 'history-event', params.eventId], queryFn: () => miHistoryService.event(params.eventId) });
  if (query.isLoading) return <div className="p-6">Loading history event...</div>;
  if (query.error || !query.data) return <div className="m-6 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-200">History event not found or access denied.</div>;
  return <main className="p-4 lg:p-6"><HistoryEventDetailDrawer event={{ ...query.data.event, beforeValues: query.data.beforeAfter.before, afterValues: query.data.beforeAfter.after }} onClose={() => history.back()} /></main>;
}
