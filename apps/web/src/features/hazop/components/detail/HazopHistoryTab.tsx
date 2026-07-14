'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useMyPermissions } from '@/features/iam/hooks/useIam';
import { useHazopHistory } from '../../hooks/useHazopHistory';
import { useHazopHistoryFilters } from '../../hooks/useHazopHistoryFilters';
import { hazopHistoryService } from '../../services/hazop-history.service';
import type { HazopHistoryEvent } from '../../types/hazop-history.types';
import { HazopHistoryEventDrawer } from '../history/HazopHistoryEventDrawer';
import { HazopHistoryFilters } from '../history/HazopHistoryFilters';
import { HazopHistoryRegister } from '../history/HazopHistoryRegister';
import { HazopHistorySummaryCards } from '../history/HazopHistorySummaryCards';
import { HazopHistoryTimeline } from '../history/HazopHistoryTimeline';
import { HazopSafetyCriticalEventsPanel } from '../history/HazopSafetyCriticalEventsPanel';

export function HazopHistoryTab({ study }: { study: any }) {
  const permissions = useMyPermissions().data ?? [];
  const can = (permission: string) => permissions.includes(permission) || permissions.includes('hazop:manage');
  const [filters, setFilters] = useHazopHistoryFilters({ category: 'All', severity: 'All' });
  const [selected, setSelected] = useState<HazopHistoryEvent | null>(null);
  const queries = useHazopHistory(study.id, filters);
  const events = queries.events.data ?? [];
  const safety = queries.safetyCritical.data ?? [];

  if (!can('hazop.history.view')) return <StateCard tone="red" title="Permission denied" text="You do not have permission to view HAZOP history." />;
  const open = async (event: HazopHistoryEvent) => setSelected(await hazopHistoryService.detail(study.id, event.id));
  const exportHistory = async () => {
    const file = await hazopHistoryService.export(study.id, filters);
    const blob = new Blob([file.content], { type: file.contentType ?? 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.fileName ?? `${study.study_number}-history.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return <div className="space-y-5">{queries.events.isError ? <StateCard tone="red" title="Unable to load history" text="Check HAZOP history migration and permissions." /> : null}<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-xl font-semibold">History</h2><p className="text-sm text-[var(--psm-muted)]">Immutable HAZOP event timeline across risk, safeguards, recommendations, team, linked records, review, signatures, and attachments.</p></div>{can('hazop.history.export') ? <button onClick={exportHistory} className="inline-flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold"><Download size={15} /> Export</button> : null}</div><HazopHistorySummaryCards summary={queries.summary.data} onFilter={(key) => key === 'safetyCriticalEvents' ? setFilters((current) => ({ ...current, safetyCritical: true })) : undefined} /><HazopHistoryFilters filters={filters} onChange={setFilters} /><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-5"><HazopHistoryTimeline events={events} onOpen={open} /><HazopHistoryRegister events={events} onOpen={open} /></div><HazopSafetyCriticalEventsPanel events={safety} onOpen={open} /></div><HazopHistoryEventDrawer event={selected} onClose={() => setSelected(null)} /></div>;
}

function StateCard({ tone, title, text }: { tone: 'red' | 'amber'; title: string; text: string }) {
  const color = tone === 'red' ? 'border-red-500/30 bg-red-500/10 text-red-100' : 'border-amber-500/30 bg-amber-500/10 text-amber-100';
  return <div className={`rounded-xl border p-4 ${color}`}><div className="font-semibold">{title}</div><p className="mt-1 text-sm opacity-80">{text}</p></div>;
}
