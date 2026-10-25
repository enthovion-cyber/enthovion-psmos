'use client';

import { Link2, AlertOctagon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useMutationToast } from '@/providers/ToastProvider';
import { useDocuments } from '@/features/documents/hooks/useDocuments';
import { AttachmentPreviewDrawer } from '../attachments/AttachmentPreviewDrawer';
import { AttachmentSummaryCard } from '../attachments/AttachmentSummaryCard';
import { AttachmentsGrid } from '../attachments/AttachmentsGrid';
import { AttachmentUploadPanel } from '../attachments/AttachmentUploadPanel';
import { LinkDocumentDialog } from '../attachments/LinkDocumentDialog';
import { RequiredAttachmentsChecklist } from '../attachments/RequiredAttachmentsChecklist';
import { usePermitAttachmentMutations } from '../../hooks/usePermitAttachmentMutations';
import { usePermitAttachmentRequirements, usePermitAttachments, usePermitAttachmentSummary } from '../../hooks/usePermitAttachments';
import type { AttachmentUploadValues, LinkDocumentValues } from '../../schemas/attachment.schema';
import { ptwAttachmentService, type AttachmentPreview, type PermitAttachment } from '../../services/ptw-attachment.service';

export function PermitAttachmentsTab({ permit }: { permit: any }) {
  const toast = useMutationToast();
  const attachments = usePermitAttachments(permit.id);
  const summary = usePermitAttachmentSummary(permit.id);
  const requirements = usePermitAttachmentRequirements(permit.id);
  const mutations = usePermitAttachmentMutations(permit.id);
  const [previewTarget, setPreviewTarget] = useState<PermitAttachment | null>(null);
  const [preview, setPreview] = useState<AttachmentPreview | undefined>();
  const [linkOpen, setLinkOpen] = useState(false);
  const [documentSearch, setDocumentSearch] = useState('');
  const documents = useDocuments(documentSearch ? { search: documentSearch } : undefined);

  async function run(work: () => Promise<unknown>, success: string) {
    try {
      await work();
      toast.success(success);
    } catch (error) {
      toast.error('Attachment action failed', error instanceof Error ? error.message : 'Request failed');
    }
  }

  async function openPreview(attachment: PermitAttachment) {
    setPreviewTarget(attachment);
    try {
      setPreview(await ptwAttachmentService.preview(permit.id, attachment.id));
    } catch {
      setPreview(undefined);
    }
  }

  function upload(file: File, values: AttachmentUploadValues) {
    run(() => mutations.upload.mutateAsync({ file, input: values }), 'Attachment uploaded');
  }

  function linkDocument(values: LinkDocumentValues) {
    run(() => mutations.linkDocument.mutateAsync(values), 'Document linked');
    setLinkOpen(false);
  }

  return (
    <div className="space-y-4 w-full text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Structural Metric Framework Summary Section */}
      <AttachmentSummaryCard summary={summary.data} />

      {/* 2. Critical Safety Isolation / Required Blocker Alert Box */}
      {summary.data?.missingRequired && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 text-xs font-semibold text-rose-800 dark:text-rose-400 shadow-sm backdrop-blur-sm animate-pulse">
          <AlertOctagon size={16} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="space-y-0.5">
            <span className="font-bold uppercase tracking-wider block">Required Attachment Blocker Triggered</span>
            <span className="text-rose-700 dark:text-rose-300/90 leading-relaxed block font-normal">
              Execution authorization and state changes are suspended. Upload or link all missing mandatory clearance files before activation or closure.
            </span>
          </div>
        </div>
      )}

      {/* 3. Main Dashboard Double Column Matrix Viewport */}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr] items-start">
        {/* Left Control Column: Tools & Prerequisites Checklist */}
        <aside className="space-y-4 w-full">
          {/* File Ingestion Dropzone Core Panel */}
          <AttachmentUploadPanel onUpload={upload} saving={mutations.upload.isPending} />

          {/* Policy Clearance Checklist Sub-module */}
          <RequiredAttachmentsChecklist requirements={requirements.data} attachments={attachments.data} />

          {/* Global Controlled Document Bridge Trigger Button */}
          <button
            type="button"
            onClick={() => setLinkOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 active:scale-98 w-full shadow-xs"
          >
            <Link2 size={14} className="text-primary dark:text-sky-400" />
            <span>Link Document Control File</span>
          </button>
        </aside>

        {/* Right Content Column: Active Repository Grid Output View */}
        <div className="space-y-4 w-full min-w-0">
          {attachments.isLoading && (
            <section className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/60 text-slate-500">
                <Loader2 size={14} className="animate-spin text-primary dark:text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Synchronizing Repository Files...</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/40"
                  />
                ))}
              </div>
            </section>
          )}

          {attachments.isError && (
            <section className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/5 p-6 text-center text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 shadow-sm">
              <AlertOctagon size={24} className="mx-auto mb-2 text-rose-600 dark:text-rose-400" />
              Unable to load attachments. Retry exploration after validating token parameters or checking API gateway access.
            </section>
          )}

          <AttachmentsGrid
            attachments={attachments.data}
            downloadUrl={(id) => ptwAttachmentService.downloadUrl(permit.id, id)}
            onPreview={openPreview}
            onDelete={(id) => run(() => mutations.delete.mutateAsync(id), 'Attachment deleted')}
          />
        </div>
      </div>

      {/* 4. Global Layer Modal Triggers & Side Drawers */}
      <AttachmentPreviewDrawer
        attachment={previewTarget}
        preview={preview}
        downloadUrl={previewTarget ? ptwAttachmentService.downloadUrl(permit.id, previewTarget.id) : '#'}
        onClose={() => {
          setPreviewTarget(null);
          setPreview(undefined);
        }}
      />

      <LinkDocumentDialog
        open={linkOpen}
        documents={documents.data}
        onSearch={setDocumentSearch}
        onClose={() => setLinkOpen(false)}
        onSubmit={linkDocument}
        saving={mutations.linkDocument.isPending}
      />
    </div>
  );
}
