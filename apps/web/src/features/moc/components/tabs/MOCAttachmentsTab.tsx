'use client';

import { useState } from 'react';
import { ErrorState, LoadingState } from '../moc-detail-ui';
import { MOCAttachmentPreviewDrawer } from '../attachments/MOCAttachmentPreviewDrawer';
import { MOCAttachmentSummaryCard } from '../attachments/MOCAttachmentSummaryCard';
import { MOCAttachmentUploadPanel } from '../attachments/MOCAttachmentUploadPanel';
import { MOCAttachmentsTable } from '../attachments/MOCAttachmentsTable';
import { MOCLinkDocumentDialog } from '../attachments/MOCLinkDocumentDialog';
import { useMOCAttachmentMutations } from '../../hooks/useMOCAttachmentMutations';
import { useMOCAttachments } from '../../hooks/useMOCAttachments';

export function MOCAttachmentsTab({ moc }: { moc: any }) {
  const { attachments, summary } = useMOCAttachments(moc.id);
  const mutations = useMOCAttachmentMutations(moc.id);
  const [input, setInput] = useState({ title: '', attachmentType: 'Field photo', relatedSection: 'General', description: '' });
  const [linkDraft, setLinkDraft] = useState({ documentId: '', documentVersionId: '' });
  const [file, setFile] = useState<File | undefined>();
  const [selected, setSelected] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);

  if (attachments.isLoading || summary.isLoading) return <LoadingState />;
  if (attachments.isError) return <ErrorState message="Unable to load MOC attachments." />;

  const upload = () => {
    if (!file) return;
    mutations.upload.mutate({ ...input, file });
  };
  const previewAttachment = async (row: any) => {
    setSelected(row);
    const result = await mutations.preview.mutateAsync(row.id);
    setPreview(result);
  };

  return (
    <div className="space-y-4">
      <MOCAttachmentSummaryCard summary={summary.data} />
      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <MOCAttachmentUploadPanel draft={input} setDraft={setInput} file={file} setFile={setFile} onUpload={upload} isUploading={mutations.upload.isPending} />
        <MOCLinkDocumentDialog draft={linkDraft} setDraft={setLinkDraft} onLink={() => mutations.linkDocument.mutate(linkDraft)} isLinking={mutations.linkDocument.isPending} />
      </div>
      <MOCAttachmentsTable rows={attachments.data ?? []} onPreview={previewAttachment} onDownload={(id: string) => mutations.download.mutate(id)} onDelete={(id: string) => mutations.delete.mutate(id)} />
      <MOCAttachmentPreviewDrawer attachment={selected} preview={preview} onClose={() => { setSelected(null); setPreview(null); }} onDownload={(id: string) => mutations.download.mutate(id)} />
    </div>
  );
}
