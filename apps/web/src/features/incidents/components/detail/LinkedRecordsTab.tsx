'use client';

import { useState } from 'react';
import { useIncidentLinkedRecords, useIncidentLinkedRecordsMutations } from '../../hooks/useIncidentLinkedRecords';
import { AddLinkRecordDrawer } from '../linked-records/AddLinkRecordDrawer';
import { BrokenStaleSupersededLinksPanel } from '../linked-records/BrokenStaleSupersededLinksPanel';
import { DocumentProcedureSdsLinksPanel } from '../linked-records/DocumentProcedureSdsLinksPanel';
import { LinkedActionsCapaSnapshotPanel } from '../linked-records/LinkedActionsCapaSnapshotPanel';
import { LinkedRecordsChangeHistoryPanel } from '../linked-records/LinkedRecordsChangeHistoryPanel';
import { LinkedRecordsHeader } from '../linked-records/LinkedRecordsHeader';
import { LinkedRecordsReadinessPanel } from '../linked-records/LinkedRecordsReadinessPanel';
import { LinkedRecordsRegister } from '../linked-records/LinkedRecordsRegister';
import { LinkedRecordsReviewPanel } from '../linked-records/LinkedRecordsReviewPanel';
import { LinkedRecordsSummaryCards } from '../linked-records/LinkedRecordsSummaryCards';
import { ModuleBasedLinkedRecordsPanel } from '../linked-records/ModuleBasedLinkedRecordsPanel';
import { PsmReviewLinksPanel } from '../linked-records/PsmReviewLinksPanel';
import { RecordImpactUpdatePanel } from '../linked-records/RecordImpactUpdatePanel';
import { RequiredLinksReadinessPanel } from '../linked-records/RequiredLinksReadinessPanel';
import { SourceGeneratedRecordsPanel } from '../linked-records/SourceGeneratedRecordsPanel';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';

export function LinkedRecordsTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentLinkedRecords(incidentId);
  const mutations = useIncidentLinkedRecordsMutations(incidentId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);
  const saving = Object.values(mutations).some((mutation: any) => mutation.isPending);

  if (isLoading) return <TabStatePanel title="Loading Linked Records" message="Loading linked records, required links, impacts, broken/stale status, actions, document links, PSM review links, history, and readiness." />;
  if (error) return <TabStatePanel title="Could not load Linked Records" message={error instanceof Error ? error.message : 'The Linked Records API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No Linked Records data" message="No Linked Records data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view linked records.'} tone="danger" />;

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const add = () => {
    setForm({
      module: 'Other',
      recordType: 'Other',
      relationship: 'Related record',
      sourceGeneratedType: 'Related record',
      linkStatus: 'Active',
      impactStatus: 'No change required'
    });
    setOpen(true);
  };
  const edit = (row: any) => {
    setForm(fromLinkedRecord(row));
    setOpen(true);
  };
  const save = async () => {
    try {
      const values = normalizeLinkedRecord(form);
      if (form.id) await mutations.update.mutateAsync({ linkId: form.id, values });
      else await mutations.create.mutateAsync(values);
      setOpen(false);
      setMessage('Linked record saved.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const unlink = async (row: any) => {
    const reason = window.prompt('Reason for unlinking or archiving this linked record');
    if (!reason) return;
    try {
      await mutations.delete.mutateAsync({ linkId: row.id, values: { reason } });
      setMessage('Linked record unlinked.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const refreshRow = async (row: any) => {
    try {
      await mutations.refresh.mutateAsync(row.id);
      setMessage('Linked record status refreshed.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const updateImpact = async (row: any) => {
    const impact = (data.recordImpacts?.rows ?? []).find((item: any) => item.linked_record_id === row.id);
    if (!impact) {
      setMessage('No backend impact row exists for this link yet. Use Action to create a follow-up impact.');
      return;
    }
    const reason = window.prompt('Impact/update reason', impact.reason ?? 'Linked record requires review');
    if (!reason) return;
    try {
      await mutations.updateImpact.mutateAsync({
        impactId: impact.id,
        values: { reason, updateRequired: true, updateStatus: 'Open', notes: reason }
      });
      setMessage('Record impact updated.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const createFollowup = async (row?: any) => {
    const target = row ?? data.linkedRecordsRegister?.find((item: any) => item.update_required || item.impact_status !== 'No change required') ?? data.linkedRecordsRegister?.[0];
    if (!target) {
      setMessage('No linked record is available for follow-up action creation.');
      return;
    }
    const title = window.prompt('Follow-up action title', `Review linked record ${target.record_number_snapshot ?? target.link_number ?? target.id}`);
    if (!title) return;
    try {
      await mutations.createFollowup.mutateAsync({
        linkedRecordId: target.id,
        title,
        reason: title,
        ownerId: target.owner_id,
        dueDate: target.due_date
      });
      setMessage('Follow-up action created through the backend action integration.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const autoDetect = async () => {
    try {
      await mutations.autoDetect.mutateAsync({ reason: 'Auto-detected from Linked Records tab' });
      setMessage('Related records auto-detected.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const refreshAll = async () => {
    try {
      await mutations.refreshAll.mutateAsync();
      setMessage('All linked record statuses refreshed.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const requestReview = async () => {
    try {
      await mutations.requestReview.mutateAsync({ reason: 'Linked Records review requested from tab' });
      setMessage('Linked Records review requested.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const approveReview = async () => {
    try {
      await mutations.approveReview.mutateAsync({ comments: 'Linked Records review approved from tab' });
      setMessage('Linked Records review approved.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const rejectReview = async () => {
    const reason = window.prompt('Reason for rejecting Linked Records review');
    if (!reason) return;
    try {
      await mutations.rejectReview.mutateAsync({ reason });
      setMessage('Linked Records review rejected.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const exportIndex = async () => {
    try {
      await mutations.export.mutateAsync();
      setMessage('Linked Records export index generated.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };

  return <div className="grid gap-4">
    <LinkedRecordsHeader data={data} saving={saving} message={message} onAdd={add} onAutoDetect={autoDetect} onCreateFollowup={() => createFollowup()} onRefreshStatus={refreshAll} onRequestReview={requestReview} onExport={exportIndex} onSaveChanges={() => setMessage('Open a linked record row to save detailed changes.')} onRefresh={() => refetch()} />
    <LinkedRecordsSummaryCards cards={data.summaryCards ?? []} />
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
      <LinkedRecordsRegister rows={data.linkedRecordsRegister ?? []} onEdit={edit} onDelete={unlink} onRefresh={refreshRow} onImpact={updateImpact} onFollowup={createFollowup} />
      <RequiredLinksReadinessPanel data={data.requiredLinksReadiness} />
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      <ModuleBasedLinkedRecordsPanel rows={data.modulePanels ?? []} />
      <SourceGeneratedRecordsPanel data={data.sourceGenerated} />
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      <RecordImpactUpdatePanel data={data.recordImpacts} />
      <BrokenStaleSupersededLinksPanel rows={data.brokenStale ?? []} />
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      <LinkedActionsCapaSnapshotPanel data={data.actionsSnapshot} />
      <DocumentProcedureSdsLinksPanel rows={data.documentLinks ?? []} />
      <PsmReviewLinksPanel rows={data.psmReviewLinks ?? []} />
    </div>
    <div className="grid gap-4 xl:grid-cols-2">
      <LinkedRecordsReviewPanel review={data.review} onRequest={requestReview} onApprove={approveReview} onReject={rejectReview} />
      <LinkedRecordsReadinessPanel readiness={data.readiness} />
    </div>
    <LinkedRecordsChangeHistoryPanel rows={data.changeHistory ?? []} />
    <AddLinkRecordDrawer open={open} form={form} set={set} context={data.context} saving={saving} onClose={() => setOpen(false)} onSave={save} />
  </div>;
}

function fromLinkedRecord(row: Record<string, any>) {
  return {
    id: row.id,
    module: row.module,
    recordType: row.record_type,
    recordId: row.record_id,
    recordNumberSnapshot: row.record_number_snapshot,
    recordTitleSnapshot: row.record_title_snapshot,
    relationship: row.relationship,
    sourceGeneratedType: row.source_generated_type,
    linkStatus: row.link_status,
    impactStatus: row.impact_status,
    ownerId: row.owner_id,
    dueDate: row.due_date,
    updateRequired: row.update_required,
    restricted: row.restricted,
    blocking: row.blocking,
    notes: row.notes,
    linkReason: row.link_reason,
    universalActionId: row.universal_action_id,
    changeReason: row.change_reason
  };
}

function normalizeLinkedRecord(form: Record<string, any>) {
  return {
    module: form.module,
    recordType: form.recordType,
    recordId: form.recordId,
    recordNumberSnapshot: form.recordNumberSnapshot,
    recordTitleSnapshot: form.recordTitleSnapshot,
    relationship: form.relationship ?? 'Related record',
    sourceGeneratedType: form.sourceGeneratedType ?? 'Related record',
    linkStatus: form.linkStatus ?? 'Active',
    impactStatus: form.impactStatus ?? 'No change required',
    ownerId: form.ownerId,
    dueDate: form.dueDate,
    updateRequired: !!form.updateRequired,
    restricted: !!form.restricted,
    blocking: !!form.blocking,
    notes: form.notes,
    linkReason: form.linkReason,
    reason: form.changeReason ?? form.linkReason ?? form.notes,
    universalActionId: form.universalActionId
  };
}
