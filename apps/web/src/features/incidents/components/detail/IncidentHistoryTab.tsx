'use client';

import { useState } from 'react';
import { CapaActionHistoryPanel } from '../history/CapaActionHistoryPanel';
import { EvidenceAttachmentHistoryPanel } from '../history/EvidenceAttachmentHistoryPanel';
import { ExportHistoryLogPanel } from '../history/ExportHistoryLogPanel';
import { FieldChangeDiffPanel } from '../history/FieldChangeDiffPanel';
import { FullIncidentTimelineAuditTrail } from '../history/FullIncidentTimelineAuditTrail';
import { HistoryFilterPanel } from '../history/HistoryFilterPanel';
import { HistoryHeader } from '../history/HistoryHeader';
import { HistorySummaryCards } from '../history/HistorySummaryCards';
import { NotificationReportingHistoryPanel } from '../history/NotificationReportingHistoryPanel';
import { ReviewApprovalSignatureHistoryPanel } from '../history/ReviewApprovalSignatureHistoryPanel';
import { StatusTransitionHistoryPanel } from '../history/StatusTransitionHistoryPanel';
import { UserActivityAccessHistoryPanel } from '../history/UserActivityAccessHistoryPanel';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';
import { useIncidentHistory, useIncidentHistoryMutations } from '../../hooks/useIncidentHistory';

export function IncidentHistoryTab({ incidentId }: { incidentId: string }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedDiff, setSelectedDiff] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useIncidentHistory(incidentId, filters);
  const mutations = useIncidentHistoryMutations(incidentId, filters);
  if (isLoading) return <TabStatePanel title="Loading History" message="Loading immutable incident history, audit trail, diffs, review/e-signature, evidence, CAPA/action, notification/reporting, and access history." />;
  if (error) return <TabStatePanel title="Could not load History" message={error instanceof Error ? error.message : 'The History API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No History data" message="No history payload was returned." tone="danger" />;
  const setFilter = (key: string, value: any) => setFilters((current) => ({ ...current, [key]: value || undefined }));
  const exportHistory = async () => { try { const result = await mutations.exportHistory.mutateAsync(); setMessage(`History export prepared with ${result.count ?? 0} event(s).`); } catch (event) { setMessage(errorText(event)); } };
  const diff = selectedDiff ? selectedDiff : data.diff;
  return <div className="grid gap-4">
    <HistoryHeader data={data} exporting={mutations.exportHistory.isPending} message={message} onRefresh={() => refetch()} onExport={exportHistory} />
    <HistorySummaryCards cards={data.summaryCards ?? []} />
    <HistoryFilterPanel filters={filters} setFilter={setFilter} context={data.filters} />
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]"><FullIncidentTimelineAuditTrail rows={data.events ?? []} onSelect={(row: any) => setSelectedDiff(buildLocalDiff(row))} /><FieldChangeDiffPanel diff={diff} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><StatusTransitionHistoryPanel rows={data.statusTransitions ?? []} /><ReviewApprovalSignatureHistoryPanel rows={data.reviewApproval ?? []} /></div>
    <div className="grid gap-4 xl:grid-cols-3"><EvidenceAttachmentHistoryPanel rows={data.evidence ?? []} /><CapaActionHistoryPanel rows={data.actions ?? []} /><NotificationReportingHistoryPanel rows={data.notifications ?? []} /></div>
    <div className="grid gap-4 xl:grid-cols-2"><UserActivityAccessHistoryPanel rows={data.access ?? []} /><ExportHistoryLogPanel data={data.exportPanel} exporting={mutations.exportHistory.isPending} onExport={exportHistory} /></div>
  </div>;
}

function buildLocalDiff(row: any) {
  const before = row.before_values_json ?? {};
  const after = row.after_values_json ?? {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  return { available: keys.length > 0, eventId: row.id, changedBy: row.actor_user_id, changedAt: row.created_at, reason: row.event_description, rows: keys.map((key) => ({ fieldName: key, previousValue: before[key], newValue: after[key] })) };
}
