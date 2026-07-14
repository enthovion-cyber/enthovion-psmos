'use client';

import { useState } from 'react';
import { AddEditTimelineEventDrawer } from '../timeline/AddEditTimelineEventDrawer';
import { EmergencyResponseTimelinePanel } from '../timeline/EmergencyResponseTimelinePanel';
import { EventMomentPanel } from '../timeline/EventMomentPanel';
import { EvidenceMappedTimelinePanel } from '../timeline/EvidenceMappedTimelinePanel';
import { PostEventStabilizationPanel } from '../timeline/PostEventStabilizationPanel';
import { PreEventConditionsPanel } from '../timeline/PreEventConditionsPanel';
import { TimelineChangeHistoryPanel } from '../timeline/TimelineChangeHistoryPanel';
import { TimelineEventsRegister } from '../timeline/TimelineEventsRegister';
import { TimelineGapsConflictsPanel } from '../timeline/TimelineGapsConflictsPanel';
import { TimelineHeader } from '../timeline/TimelineHeader';
import { TimelinePhaseBreakdownPanel } from '../timeline/TimelinePhaseBreakdownPanel';
import { TimelineReadinessPanel } from '../timeline/TimelineReadinessPanel';
import { TimelineReviewPanel } from '../timeline/TimelineReviewPanel';
import { TimelineSourceReliabilityPanel } from '../timeline/TimelineSourceReliabilityPanel';
import { TimelineSummaryCards } from '../timeline/TimelineSummaryCards';
import { VisualChronologicalTimeline } from '../timeline/VisualChronologicalTimeline';
import { TabStatePanel, errorText, toLocalInput } from '../shared/IncidentTabPrimitives';
import { useIncidentTimeline, useIncidentTimelineMutations } from '../../hooks/useIncidentTimeline';

export function TimelineTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentTimeline(incidentId);
  const mutations = useIncidentTimelineMutations(incidentId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);
  const saving = Object.values(mutations).some((mutation: any) => mutation.isPending);

  if (isLoading) return <TabStatePanel title="Loading Timeline" message="Loading real incident chronology, evidence mappings, gaps, conflicts, review, and readiness." />;
  if (error) return <TabStatePanel title="Could not load Timeline" message={error instanceof Error ? error.message : 'The tab API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No Timeline data" message="No data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view this incident timeline.'} tone="danger" />;

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const add = () => { setForm({ status: 'Draft' }); setDrawerOpen(true); };
  const edit = (row: any) => { setForm(fromTimelineRow(row)); setDrawerOpen(true); };
  const save = async () => {
    setMessage(null);
    try {
      if (form.id) await mutations.update.mutateAsync({ eventId: form.id, values: form });
      else await mutations.create.mutateAsync(form);
      setDrawerOpen(false);
      setMessage('Timeline event saved.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const remove = async (eventId: string) => {
    if (!window.confirm('Delete this timeline event?')) return;
    try { await mutations.remove.mutateAsync(eventId); setMessage('Timeline event deleted.'); } catch (event) { setMessage(errorText(event)); }
  };
  const requestReview = async () => {
    try { await mutations.requestReview.mutateAsync({ reason: 'Timeline review requested' }); setMessage('Timeline review requested.'); } catch (event) { setMessage(errorText(event)); }
  };
  const approve = async () => {
    try { await mutations.approveReview.mutateAsync({ reason: 'Timeline approved' }); setMessage('Timeline review approved.'); } catch (event) { setMessage(errorText(event)); }
  };
  const reject = async () => {
    const reason = window.prompt('Reason for rejecting timeline review');
    if (!reason) return;
    try { await mutations.rejectReview.mutateAsync({ reason }); setMessage('Timeline review rejected.'); } catch (event) { setMessage(errorText(event)); }
  };

  return (
    <div className="grid gap-4">
      <TimelineHeader data={data} saving={saving} message={message} onAdd={add} onRequestReview={requestReview} onRefresh={() => refetch()} />
      <TimelineSummaryCards cards={data.summaryCards ?? []} />
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <VisualChronologicalTimeline rows={data.visualTimeline ?? []} />
        <TimelineReadinessPanel readiness={data.readiness} />
      </div>
      <TimelineEventsRegister rows={data.eventsRegister ?? []} onEdit={edit} onDelete={remove} canDelete={data.permissions?.canDelete} />
      <div className="grid gap-4 xl:grid-cols-3">
        <TimelinePhaseBreakdownPanel data={data.phaseBreakdown} />
        <PreEventConditionsPanel data={data.preEventConditions} />
        <EventMomentPanel data={data.eventMoment} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <EmergencyResponseTimelinePanel data={data.emergencyResponseTimeline} />
        <PostEventStabilizationPanel data={data.postEventStabilization} />
        <EvidenceMappedTimelinePanel rows={data.evidenceMappedTimeline ?? []} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <TimelineGapsConflictsPanel data={data.gapsConflicts} />
        <TimelineSourceReliabilityPanel data={data.sourceReliability} />
        <TimelineReviewPanel review={data.review} onApprove={approve} onReject={reject} />
      </div>
      <TimelineChangeHistoryPanel rows={data.changeHistory ?? []} />
      <AddEditTimelineEventDrawer open={drawerOpen} form={form} set={set} saving={saving} onClose={() => setDrawerOpen(false)} onSave={save} />
    </div>
  );
}

function fromTimelineRow(row: any) {
  return {
    id: row.id,
    eventTime: toLocalInput(row.event_time),
    eventTimeEnd: toLocalInput(row.event_time_end),
    phase: row.phase,
    title: row.title,
    description: row.description,
    location: row.location,
    involvedPeople: row.involved_people,
    relatedEquipmentId: row.related_equipment_id,
    relatedChemicalId: row.related_chemical_id,
    relatedEvidenceId: row.related_evidence_id,
    sourceType: row.source_type,
    sourceReference: row.source_reference,
    sourceReliability: row.source_reliability,
    confidence: row.confidence,
    status: row.status,
    gapFlag: !!row.gap_flag,
    conflictFlag: !!row.conflict_flag,
    notes: row.notes
  };
}
