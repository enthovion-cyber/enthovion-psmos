'use client';

import { useState } from 'react';
import { ChainOfCustodyPanel } from '../evidence-attachments/ChainOfCustodyPanel';
import { DocumentControlLinkedDocumentsPanel } from '../evidence-attachments/DocumentControlLinkedDocumentsPanel';
import { EvidenceAttachmentsHeader } from '../evidence-attachments/EvidenceAttachmentsHeader';
import { EvidenceBulkActionsPanel } from '../evidence-attachments/EvidenceBulkActionsPanel';
import { EvidenceChangeHistoryPanel } from '../evidence-attachments/EvidenceChangeHistoryPanel';
import { EvidenceDetailDrawer } from '../evidence-attachments/EvidenceDetailDrawer';
import { EvidenceMappingPanel } from '../evidence-attachments/EvidenceMappingPanel';
import { EvidenceReadinessPanel } from '../evidence-attachments/EvidenceReadinessPanel';
import { EvidenceRegister } from '../evidence-attachments/EvidenceRegister';
import { EvidenceReviewPanel } from '../evidence-attachments/EvidenceReviewPanel';
import { EvidenceSummaryCards } from '../evidence-attachments/EvidenceSummaryCards';
import { EvidenceVersionHistoryPanel } from '../evidence-attachments/EvidenceVersionHistoryPanel';
import { FilePreviewPanel } from '../evidence-attachments/FilePreviewPanel';
import { RequiredEvidenceChecklistPanel } from '../evidence-attachments/RequiredEvidenceChecklistPanel';
import { RestrictedConfidentialEvidencePanel } from '../evidence-attachments/RestrictedConfidentialEvidencePanel';
import { UploadEvidenceDrawer } from '../evidence-attachments/UploadEvidenceDrawer';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';
import { useIncidentEvidence, useIncidentEvidenceMutations } from '../../hooks/useIncidentEvidence';

export function EvidenceAttachmentsTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentEvidence(incidentId);
  const mutations = useIncidentEvidenceMutations(incidentId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const saving = Object.values(mutations).some((mutation: any) => mutation.isPending);

  if (isLoading) return <TabStatePanel title="Loading Evidence / Attachments" message="Loading real evidence, versions, mappings, custody, document links, review, and readiness." />;
  if (error) return <TabStatePanel title="Could not load Evidence / Attachments" message={error instanceof Error ? error.message : 'The tab API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No Evidence / Attachments data" message="No data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted incident" message={data.summaryCards?.[0]?.help ?? 'You do not have permission to view evidence for this incident.'} tone="danger" />;

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const upload = () => { setForm({ status: 'Active', uploadStatus: 'Metadata Captured' }); setDrawerOpen(true); };
  const edit = (row: any) => { setForm(fromEvidenceRow(row)); setDetailRow(row); setDetailOpen(true); setDrawerOpen(true); };
  const save = async () => {
    setMessage(null);
    try {
      if (form.id) await mutations.update.mutateAsync({ evidenceId: form.id, values: form });
      else await mutations.create.mutateAsync(form);
      setDrawerOpen(false);
      setMessage('Evidence metadata saved.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const archive = async (evidenceId: string) => {
    try { await mutations.archive.mutateAsync({ evidenceId, values: { reason: 'Evidence archived from tab' } }); setMessage('Evidence archived.'); } catch (event) { setMessage(errorText(event)); }
  };
  const remove = async (evidenceId: string) => {
    if (!window.confirm('Delete this evidence record?')) return;
    try { await mutations.remove.mutateAsync(evidenceId); setMessage('Evidence deleted.'); } catch (event) { setMessage(errorText(event)); }
  };
  const preview = async (evidenceId: string) => {
    try {
      const result = await mutations.preview.mutateAsync(evidenceId);
      setAccessMessage(result?.signedUrl ? 'Preview link generated.' : (result?.unavailableReason ?? 'Preview metadata returned.'));
    } catch (event) { setAccessMessage(errorText(event)); }
  };
  const download = async (evidenceId: string) => {
    try {
      const result = await mutations.download.mutateAsync(evidenceId);
      setAccessMessage(result?.signedUrl ? 'Download link generated.' : (result?.unavailableReason ?? 'Download metadata returned.'));
    } catch (event) { setAccessMessage(errorText(event)); }
  };
  const exportIndex = async () => {
    try { const result = await mutations.exportIndex.mutateAsync(); setMessage(`Evidence index ready: ${result?.filename ?? 'export generated'}`); } catch (event) { setMessage(errorText(event)); }
  };
  const requestReview = async () => {
    try { await mutations.requestReview.mutateAsync({ reason: 'Evidence / Attachments review requested' }); setMessage('Evidence review requested.'); } catch (event) { setMessage(errorText(event)); }
  };
  const approve = async () => {
    try { await mutations.approveReview.mutateAsync({ reason: 'Evidence approved' }); setMessage('Evidence review approved.'); } catch (event) { setMessage(errorText(event)); }
  };
  const reject = async () => {
    const reason = window.prompt('Reason for rejecting evidence review');
    if (!reason) return;
    try { await mutations.rejectReview.mutateAsync({ reason }); setMessage('Evidence review rejected.'); } catch (event) { setMessage(errorText(event)); }
  };

  return (
    <div className="grid gap-4">
      <EvidenceAttachmentsHeader data={data} saving={saving} message={message} onUpload={upload} onRequestReview={requestReview} onExport={exportIndex} onRefresh={() => refetch()} />
      <EvidenceSummaryCards cards={data.summaryCards ?? []} />
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <EvidenceRegister rows={data.evidenceRegister ?? []} onView={(row: any) => { setDetailRow(row); setDetailOpen(true); }} onEdit={edit} onPreview={preview} onDownload={download} onArchive={archive} onDelete={remove} canDelete={data.permissions?.canDelete} />
        <EvidenceReadinessPanel readiness={data.readiness} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <RequiredEvidenceChecklistPanel rows={data.requiredEvidenceChecklist ?? []} />
        <FilePreviewPanel data={data.filePreview} accessMessage={accessMessage} />
        <RestrictedConfidentialEvidencePanel data={data.restrictedConfidentialEvidence} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <EvidenceVersionHistoryPanel rows={data.versionHistory ?? []} />
        <EvidenceMappingPanel rows={data.evidenceMapping ?? []} />
        <ChainOfCustodyPanel rows={data.chainOfCustody ?? []} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <DocumentControlLinkedDocumentsPanel rows={data.documentControlLinks ?? []} />
        <EvidenceReviewPanel review={data.review} onApprove={approve} onReject={reject} />
        <EvidenceBulkActionsPanel data={data.bulkActions} onExport={exportIndex} />
      </div>
      <EvidenceChangeHistoryPanel rows={data.changeHistory ?? []} />
      <UploadEvidenceDrawer open={drawerOpen} form={form} set={set} saving={saving} onClose={() => setDrawerOpen(false)} onSave={save} />
      <EvidenceDetailDrawer open={detailOpen && !drawerOpen} row={detailRow} onClose={() => setDetailOpen(false)} />
    </div>
  );
}

function fromEvidenceRow(row: any) {
  return {
    id: row.id,
    evidenceType: row.evidence_type,
    fileName: row.file_name,
    description: row.description,
    source: row.source,
    storageProvider: row.storage_provider,
    storageKey: row.storage_key,
    fileType: row.file_type,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    classification: row.classification,
    restricted: !!row.restricted,
    confidential: !!row.confidential,
    medicalConfidential: !!row.medical_confidential,
    uploadStatus: row.upload_status,
    status: row.status,
    reviewStatus: row.review_status,
    requiredEvidence: !!row.required_evidence,
    relatedTab: row.related_tab,
    relatedRecordType: row.related_record_type,
    relatedRecordId: row.related_record_id,
    chainOfCustodyStatus: row.chain_of_custody_status,
    notes: row.notes
  };
}
