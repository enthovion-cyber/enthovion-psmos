'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLopaHistory } from '../../hooks/useLopaHistory';
import { lopaHistoryService } from '../../services/lopa-history.service';
import type { LopaAttachmentFilters } from '../../types/lopa-attachment.types';
import { HistoryHeader } from '../history/HistoryHeader';
import { HistorySummaryCards } from '../history/HistorySummaryCards';
import { HistoryFilters } from '../history/HistoryFilters';
import { HistoryTimeline } from '../history/HistoryTimeline';
import { HistoryRegister } from '../history/HistoryRegister';
import { ModuleActivityBreakdownPanel } from '../history/ModuleActivityBreakdownPanel';
import { WorkflowApprovalTimelinePanel } from '../history/WorkflowApprovalTimelinePanel';
import { ExportHistoryPanel } from '../history/ExportHistoryPanel';
import { EventDetailDrawer } from '../history/EventDetailDrawer';

export function LopaHistoryTab({ id }: { id: string }) {
  const [filters, setFilters] = useState<LopaAttachmentFilters>({ page: '1', limit: '50' });
  const [selected, setSelected] = useState<any | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const query = useLopaHistory(id, filters);
  const context = useQuery({ queryKey: ['lopa', 'history-context', id], queryFn: () => lopaHistoryService.context(id) });
  const detail = useQuery({ queryKey: ['lopa', 'history-event', id, selected?.id], queryFn: () => lopaHistoryService.detail(id, selected.id), enabled: !!selected?.id });
  const diff = useQuery({ queryKey: ['lopa', 'history-diff', id, selected?.id], queryFn: () => lopaHistoryService.diff(id, selected.id), enabled: !!selected?.id });
  const metadata = useQuery({ queryKey: ['lopa', 'history-metadata', id, selected?.id], queryFn: () => lopaHistoryService.auditMetadata(id, selected.id), enabled: !!selected?.id });
  if (query.isLoading || context.isLoading) return <State text="Loading immutable LOPA audit history..." />;
  if (query.isError || !query.data || !context.data) return <State tone="error" text="Unable to load LOPA history. Confirm history permission and migration." />;
  const data = query.data;
  const exportHistory = () => lopaHistoryService.export(id, filters).then(result => setNotice('History export generated with ' + (result.register?.total ?? 0) + ' visible event(s).')).catch(() => setNotice('History export failed or is not permitted.'));
  return <div className="space-y-4">
    {notice ? <Banner text={notice} onClose={() => setNotice(null)} /> : null}
    <HistoryHeader header={data.header} onRefresh={() => query.refetch()} onExport={exportHistory} />
    <HistorySummaryCards summary={data.summary} onFilter={(key: string) => key === 'attachmentEvents' ? setFilters({ ...filters, relatedTab: 'Attachments' }) : null} />
    <HistoryFilters filters={filters} context={context.data} onChange={setFilters} />
    <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.15fr_.85fr]">
      <HistoryTimeline events={data.timeline} onOpen={setSelected} />
      <div className="space-y-4">
        <ModuleActivityBreakdownPanel rows={data.moduleBreakdown} onFilter={(module: string) => setFilters({ ...filters, relatedTab: module })} />
        <WorkflowApprovalTimelinePanel rows={data.workflowTimeline} onOpen={setSelected} />
        <ExportHistoryPanel onExport={exportHistory} />
      </div>
    </div>
    <HistoryRegister rows={data.register.rows} onOpen={setSelected} />
    {selected ? <EventDetailDrawer event={detail.data ?? selected} diff={diff.data} metadata={metadata.data} onClose={() => setSelected(null)} /> : null}
  </div>;
}
function State({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'error' }) { return <div className={tone === 'error' ? 'rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-800 dark:text-red-100' : 'rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-cyan-300/10 dark:bg-[#071525] dark:text-slate-400'}>{text}</div>; }
function Banner({ text, onClose }: { text: string; onClose?: () => void }) { return <div className="flex justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-100"><span>{text}</span>{onClose ? <button onClick={onClose}>Dismiss</button> : null}</div>; }
