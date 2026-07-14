'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { EquipmentForm } from './EquipmentForm';
import { EquipmentHeader } from './EquipmentHeader';
import { EquipmentHierarchyTree } from './EquipmentHierarchyTree';
import { DesignConditionsCard } from './DesignConditionsCard';
import { OperatingConditionsCard } from './OperatingConditionsCard';
import { StatusCriticalityCard } from './StatusCriticalityCard';
import { ClassificationCard } from './ClassificationCard';
import { ProcessFluidCard } from './ProcessFluidCard';
import { SafetyInformationCard } from './SafetyInformationCard';
import { InspectionOverviewCard } from './InspectionOverviewCard';
import { EquipmentTimeline } from './EquipmentTimeline';
import { RelatedDocuments } from './RelatedDocuments';
import { LinkedRecordsPanel } from './LinkedRecordsPanel';
import { CrossModuleSummary } from './CrossModuleSummary';
import { NotesSection } from './NotesSection';
import { QuickActions } from './QuickActions';
import { EquipmentDocumentsPanel } from './EquipmentDocumentsPanel';
import { EquipmentAttachmentsPanel } from './EquipmentAttachmentsPanel';
import { EquipmentInspectionPanel } from './EquipmentInspectionPanel';
import { EquipmentActionsPanel } from './EquipmentActionsPanel';
import { ConfirmDialog, EnterpriseModal } from './EnterpriseOverlay';
import { useEquipment, useEquipmentActions, useEquipmentAttachments, useEquipmentDocuments, useEquipmentInspections, useEquipmentLinkedRecords, useEquipmentMutations, useEquipmentSummary, useEquipmentTimeline } from '../hooks/useEquipment';
import { equipmentService, type CreateEquipmentInput, type CreateEquipmentInspectionInput, type EquipmentAttachment, type EquipmentAction, type EquipmentDocument, type UploadEquipmentAttachmentInput, type UploadEquipmentDocumentInput } from '@/services/equipment.service';
import { useMutationToast } from '@/providers/ToastProvider';

type ActivePanel = 'overview' | 'details' | 'documents' | 'linked-records' | 'actions' | 'history' | 'inspection' | 'hierarchy' | 'attachments' | 'notes';
type ConfirmState = { title: string; message: string; confirmLabel?: string; tone?: 'danger' | 'warning' | 'primary'; action: () => Promise<void> | void } | null;

function UploadDocumentForm({ onUpload }: { onUpload: (input: UploadEquipmentDocumentInput) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('Datasheet');
  return (
    <form onSubmit={(event) => { event.preventDefault(); if (file && title) onUpload({ title, documentType, file }); }} className="space-y-4">
      <label className="block text-sm"><span className="mb-2 block text-slate-400">Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="h-10 w-full rounded-md border border-line bg-[#071523] px-3" /></label>
      <label className="block text-sm"><span className="mb-2 block text-slate-400">Document Type</span><input value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="h-10 w-full rounded-md border border-line bg-[#071523] px-3" /></label>
      <label className="block text-sm"><span className="mb-2 block text-slate-400">File</span><input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="w-full rounded-md border border-line bg-[#071523] p-2" /></label>
      <button className="h-10 rounded-md bg-info px-4 text-sm text-white">Upload</button>
    </form>
  );
}

function UploadAttachmentForm({ onUpload }: { onUpload: (input: UploadEquipmentAttachmentInput) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [attachmentType, setAttachmentType] = useState('evidence');
  return (
    <form onSubmit={(event) => { event.preventDefault(); if (file && title) onUpload({ title, attachmentType, file }); }} className="space-y-4">
      <label className="block text-sm"><span className="mb-2 block text-slate-400">Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="h-10 w-full rounded-md border border-line bg-[#071523] px-3" /></label>
      <label className="block text-sm"><span className="mb-2 block text-slate-400">Attachment Type</span><input value={attachmentType} onChange={(event) => setAttachmentType(event.target.value)} className="h-10 w-full rounded-md border border-line bg-[#071523] px-3" /></label>
      <label className="block text-sm"><span className="mb-2 block text-slate-400">File</span><input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="w-full rounded-md border border-line bg-[#071523] p-2" /></label>
      <button className="h-10 rounded-md bg-info px-4 text-sm text-white">Upload Attachment</button>
    </form>
  );
}

export function EquipmentDetail({ id }: { id: string }) {
  const [activePanel, setActivePanel] = useState<ActivePanel>('overview');
  const [linkedFilter, setLinkedFilter] = useState<string | undefined>();
  const [modal, setModal] = useState<'edit' | 'child' | 'upload' | 'attachment' | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const searchParams = useSearchParams();
  const toast = useMutationToast();
  const equipmentQuery = useEquipment(id);
  const documentsQuery = useEquipmentDocuments(id);
  const attachmentsQuery = useEquipmentAttachments(id);
  const inspectionsQuery = useEquipmentInspections(id);
  const actionsQuery = useEquipmentActions(id);
  const timelineQuery = useEquipmentTimeline(id);
  const summaryQuery = useEquipmentSummary(id);
  const linkedRecordsQuery = useEquipmentLinkedRecords(id, linkedFilter && linkedFilter !== 'documents' && linkedFilter !== 'actions' ? linkedFilter : undefined);
  const mutations = useEquipmentMutations(id);

  const equipment = equipmentQuery.data;
  const documents = documentsQuery.data ?? equipment?.documents ?? [];
  const attachments = attachmentsQuery.data ?? equipment?.attachments ?? [];
  const inspections = inspectionsQuery.data ?? equipment?.inspections ?? [];
  const actions = actionsQuery.data ?? [];
  const timeline = timelineQuery.data ?? equipment?.timelineEvents ?? [];
  const linkedRecords = linkedRecordsQuery.data ?? equipment?.linkedRecords ?? [];
  const pAndId = documents.find((doc) => /p&id|pid/i.test(`${doc.documentType} ${doc.title}`));
  const openActions = linkedRecords.filter((record) => record.moduleKey.toLowerCase() === 'actions' && !['CLOSED', 'COMPLETED'].includes(record.status));
  const openPermits = linkedRecords.filter((record) => record.moduleKey.toLowerCase() === 'ptw' && !['CLOSED', 'COMPLETED'].includes(record.status));
  const recentMocs = linkedRecords.filter((record) => record.moduleKey.toLowerCase() === 'moc').slice(0, 3);

  useEffect(() => {
    if (searchParams.get('edit') === '1') setModal('edit');
  }, [searchParams]);

  const tabs = useMemo(() => [
    ['overview', 'Overview'],
    ['details', 'Details'],
    ['documents', `Documents (${documents.length})`],
    ['linked-records', 'Linked Records'],
    ['actions', `Actions (${actions.length})`],
    ['history', 'History Timeline'],
    ['inspection', 'Inspection'],
    ['hierarchy', 'Hierarchy'],
    ['attachments', 'Attachments'],
    ['notes', 'Notes']
  ] as const, [actions.length, documents.length]);

  if (equipmentQuery.isLoading) return <DetailSkeleton />;
  if (equipmentQuery.isError || !equipment) return <div className="psm-card border-danger/40 p-6 text-danger">Unable to load equipment from API.</div>;

  function openLinked(filter?: string) {
    setLinkedFilter(filter);
    setActivePanel(filter === 'documents' ? 'documents' : filter === 'actions' ? 'actions' : 'linked-records');
  }

  function uploadPhoto(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const metadata = { ...(equipment?.metadata ?? {}), photoUrl: String(reader.result), photoFileName: file.name, photoUploadedAt: new Date().toISOString() };
      await runMutation(() => mutations.update.mutateAsync({ metadata }), 'Equipment photo updated');
    };
    reader.readAsDataURL(file);
  }

  async function runMutation<T>(action: () => Promise<T>, successTitle: string, successDescription?: string) {
    try {
      const result = await action();
      toast.success(successTitle, successDescription);
      return result;
    } catch (error) {
      toast.error('Action failed', getErrorMessage(error));
      throw error;
    }
  }

  function requestDelete(title: string, message: string, action: () => Promise<void>) {
    setConfirm({ title, message, confirmLabel: 'Delete', tone: 'danger', action });
  }

  async function saveEquipment(values: Partial<CreateEquipmentInput>, successTitle = 'Equipment saved') {
    await runMutation(() => mutations.update.mutateAsync(values), successTitle);
    setModal(null);
  }

  async function createChild(values: Partial<CreateEquipmentInput>) {
    await runMutation(() => mutations.createChild.mutateAsync(values as CreateEquipmentInput), 'Child equipment created');
    setModal(null);
  }

  async function uploadDocument(input: UploadEquipmentDocumentInput) {
    await runMutation(() => mutations.uploadDocument.mutateAsync(input), 'Document uploaded');
    setModal(null);
  }

  async function uploadAttachment(input: UploadEquipmentAttachmentInput) {
    await runMutation(() => mutations.uploadAttachment.mutateAsync(input), 'Attachment uploaded');
    setModal(null);
    setActivePanel('attachments');
  }

  async function openBlob(blob: Blob, fileName: string, download = false) {
    const url = window.URL.createObjectURL(blob);
    if (download) {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  }

  async function previewDocument(document: EquipmentDocument) {
    await openBlob(await equipmentService.documentFile(id, document.id), document.fileName);
  }

  async function downloadDocument(document: EquipmentDocument) {
    await openBlob(await equipmentService.documentFile(id, document.id), document.fileName, true);
  }

  async function previewAttachment(attachment: EquipmentAttachment) {
    await openBlob(await equipmentService.attachmentFile(id, attachment.id), attachment.fileName);
  }

  async function downloadAttachment(attachment: EquipmentAttachment) {
    await openBlob(await equipmentService.attachmentFile(id, attachment.id), attachment.fileName, true);
  }

  return (
    <div className="space-y-5 psm-fade-in">
      <EquipmentHeader equipment={equipment} />
      <div className="sticky top-16 z-20 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-1 shadow-sm">
        <div className="flex min-w-max gap-1">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActivePanel(key)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${activePanel === key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[var(--psm-muted)] hover:bg-[var(--psm-surface-3)] hover:text-[var(--psm-text)]'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-5">
          {activePanel === 'overview' ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                <DesignConditionsCard equipment={equipment} />
                <OperatingConditionsCard equipment={equipment} />
                <StatusCriticalityCard equipment={equipment} />
                <ClassificationCard equipment={equipment} />
              </section>
              <section className="grid gap-5 lg:grid-cols-2">
                <EquipmentHierarchyTree equipment={equipment} />
                <div className="psm-card p-4">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Description</h2>
                  <p className="text-sm leading-6 text-[var(--psm-muted)]">{equipment.description ?? 'No description recorded.'}</p>
                  {pAndId ? <button onClick={() => setActivePanel('documents')} className="psm-button psm-button-secondary mt-4">Open P&ID Viewer Link</button> : null}
                </div>
              </section>
              <section className="grid gap-5 lg:grid-cols-2">
                <InspectionOverviewCard inspections={inspections} onOpen={() => setActivePanel('inspection')} />
                <ProcessFluidCard equipment={equipment} />
              </section>
              <section className="grid gap-5 xl:grid-cols-3">
                <SafetyInformationCard equipment={equipment} />
                <div className="psm-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wide">Open Actions Preview</h2>
                    <button onClick={() => setActivePanel('actions')} className="text-xs font-semibold text-info">View all</button>
                  </div>
                  {actions.filter((action) => !['CLOSED', 'CANCELLED'].includes(action.status)).slice(0, 4).map((action) => (
                    <button key={action.id} onClick={() => setActivePanel('actions')} className="mb-2 block w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-left text-sm hover:border-info">
                      <div className="flex justify-between gap-3"><span>{action.title}</span><span className="text-warning">{action.priority.replace('_', ' ')}</span></div>
                      <div className="mt-1 text-xs text-[var(--psm-muted)]">{action.status.replace('_', ' ')} · Due {new Date(action.dueDate).toLocaleDateString()}</div>
                    </button>
                  ))}
                  {actions.length === 0 ? <div className="text-sm text-[var(--psm-muted)]">No actions linked to this equipment.</div> : null}
                </div>
                <LinkedRecordsPanel records={openPermits.concat(recentMocs)} />
              </section>
              <section className="psm-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide">Recent Activity Preview</h2>
                  <button onClick={() => setActivePanel('history')} className="text-xs font-semibold text-info">View timeline</button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {timeline.slice(0, 4).map((event) => (
                    <button key={event.id} onClick={() => setActivePanel('history')} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-left text-sm hover:border-info">
                      <div className="font-medium">{event.title}</div>
                      <div className="mt-1 text-xs text-[var(--psm-muted)]">{new Date(event.occurredAt).toLocaleString()} · {event.actorName ?? 'System'}</div>
                    </button>
                  ))}
                  {timeline.length === 0 ? <div className="text-sm text-[var(--psm-muted)]">No timeline events yet.</div> : null}
                </div>
              </section>
            </>
          ) : null}
          {activePanel === 'details' ? <EquipmentForm equipment={equipment} onSave={(values) => saveEquipment(values)} /> : null}
          {activePanel === 'documents' ? (
            <EquipmentDocumentsPanel
              documents={documents}
              onUpload={(input) => runMutation(() => mutations.uploadDocument.mutateAsync(input), 'Document uploaded')}
              onReplace={(documentId, input) => runMutation(() => mutations.replaceDocument.mutateAsync({ documentId, input }), 'Document replaced')}
              onDelete={(documentId) => requestDelete('Delete document?', 'This removes the controlled document link and stored file from this equipment record. This action cannot be undone.', async () => { await runMutation(() => mutations.deleteDocument.mutateAsync(documentId), 'Document deleted'); })}
              onPreview={previewDocument}
              onDownload={downloadDocument}
            />
          ) : null}
          {activePanel === 'linked-records' ? <LinkedRecordsPanel records={linkedRecords} filter={linkedFilter} /> : null}
          {activePanel === 'actions' ? (
            <EquipmentActionsPanel
              actions={actions}
              onUpdateStatus={(actionId, status) => runMutation(() => mutations.updateActionStatus.mutateAsync({ actionId, status: status as EquipmentAction['status'] }), 'Action status updated')}
              onUploadEvidence={() => setModal('attachment')}
            />
          ) : null}
          {activePanel === 'history' ? <EquipmentTimeline events={timeline} /> : null}
          {activePanel === 'inspection' ? (
            <EquipmentInspectionPanel
              inspections={inspections}
              onCreate={(input) => runMutation(() => mutations.createInspection.mutateAsync(input as CreateEquipmentInspectionInput), 'Inspection added')}
              onUpdate={(inspectionId, input) => runMutation(() => mutations.updateInspection.mutateAsync({ inspectionId, input }), 'Inspection updated')}
              onDelete={(inspectionId) => requestDelete('Delete inspection?', 'This removes the inspection history item from this equipment record. This action cannot be undone.', async () => { await runMutation(() => mutations.deleteInspection.mutateAsync(inspectionId), 'Inspection deleted'); })}
            />
          ) : null}
          {activePanel === 'hierarchy' ? <EquipmentHierarchyTree equipment={equipment} /> : null}
          {activePanel === 'attachments' ? (
            <EquipmentAttachmentsPanel
              attachments={attachments}
              onUpload={(input) => runMutation(() => mutations.uploadAttachment.mutateAsync(input), 'Attachment uploaded')}
              onDelete={(attachmentId) => requestDelete('Delete attachment?', 'This permanently removes the attachment from the equipment record. This action cannot be undone.', async () => { await runMutation(() => mutations.deleteAttachment.mutateAsync(attachmentId), 'Attachment deleted'); })}
              onPreview={previewAttachment}
              onDownload={downloadAttachment}
            />
          ) : null}
          {activePanel === 'notes' ? <NotesSection notes={equipment.notes ?? []} onAdd={(body) => runMutation(() => mutations.addNote.mutateAsync(body), 'Note added')} onEdit={(noteId, body) => runMutation(() => mutations.updateNote.mutateAsync({ noteId, body }), 'Note updated')} onDelete={(noteId) => requestDelete('Delete note?', 'This note will be removed from the equipment record. This action cannot be undone.', async () => { await runMutation(() => mutations.deleteNote.mutateAsync(noteId), 'Note deleted'); })} /> : null}
        </main>

        <aside className="space-y-4">
          <QuickActions
            onEdit={() => setModal('edit')}
            onGenerateQr={() => runMutation(() => mutations.generateQrCode.mutateAsync(), 'QR label generated')}
            onAddChild={() => setModal('child')}
            onUpload={() => setModal('upload')}
            onUploadPhoto={() => photoInputRef.current?.click()}
            onLinkedRecords={() => openLinked()}
            onActions={() => setActivePanel('actions')}
            onInspectionHistory={() => setActivePanel('inspection')}
            onDocuments={() => setActivePanel('documents')}
            onAddNote={() => setActivePanel('notes')}
          />
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadPhoto(file); event.currentTarget.value = ''; }} />
          <CrossModuleSummary summary={summaryQuery.data} onSelect={openLinked} />
          <NotesSection notes={equipment.notes ?? []} onAdd={(body) => runMutation(() => mutations.addNote.mutateAsync(body), 'Note added')} onEdit={(noteId, body) => runMutation(() => mutations.updateNote.mutateAsync({ noteId, body }), 'Note updated')} onDelete={(noteId) => requestDelete('Delete note?', 'This note will be removed from the equipment record. This action cannot be undone.', async () => { await runMutation(() => mutations.deleteNote.mutateAsync(noteId), 'Note deleted'); })} />
        </aside>
      </div>

      {modal === 'edit' ? <EnterpriseModal title="Edit Equipment" description="Changes are saved to the equipment registry and audited." onClose={() => setModal(null)} size="xl"><EquipmentForm equipment={equipment} surface="modal" onCancel={() => setModal(null)} onSave={(values) => saveEquipment(values, 'Equipment updated')} /></EnterpriseModal> : null}
      {modal === 'child' ? (
        <EnterpriseModal title="Add Child Equipment" description="Create a child asset under the current equipment hierarchy." onClose={() => setModal(null)} size="xl">
          <EquipmentForm
            title="Add Child Equipment"
            submitLabel="Create Child Equipment"
            surface="modal"
            onCancel={() => setModal(null)}
            defaultValues={{
              siteId: equipment.siteId,
              unitId: equipment.unitId,
              areaId: equipment.areaId ?? undefined,
              parentId: equipment.id,
              type: equipment.type
            }}
            onSave={createChild}
          />
        </EnterpriseModal>
      ) : null}
      {modal === 'upload' ? <EnterpriseModal title="Upload Equipment Document" description="Upload controlled documents such as P&IDs, datasheets, certificates, and SOPs." onClose={() => setModal(null)}><UploadDocumentForm onUpload={uploadDocument} /></EnterpriseModal> : null}
      {modal === 'attachment' ? <EnterpriseModal title="Upload Action Evidence / Attachment" description="Attach photos, evidence, and field files to this equipment record." onClose={() => setModal(null)}><UploadAttachmentForm onUpload={uploadAttachment} /></EnterpriseModal> : null}
      {confirm ? (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          {...(confirm.confirmLabel ? { confirmLabel: confirm.confirmLabel } : {})}
          {...(confirm.tone ? { tone: confirm.tone } : {})}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            await confirm.action();
            setConfirm(null);
          }}
        />
      ) : null}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  const responseData = typeof error === 'object' && error && 'response' in error
    ? (error as { response?: { data?: unknown } }).response?.data
    : undefined;
  if (typeof responseData === 'object' && responseData && 'message' in responseData) {
    const message = (responseData as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
  }
  return error instanceof Error ? error.message : 'The request could not be completed.';
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-56 rounded-xl psm-skeleton" />
      <div className="h-14 rounded-xl psm-skeleton" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 rounded-xl psm-skeleton" />)}</div>
          <div className="h-96 rounded-xl psm-skeleton" />
        </div>
        <div className="h-[520px] rounded-xl psm-skeleton" />
      </div>
    </div>
  );
}
