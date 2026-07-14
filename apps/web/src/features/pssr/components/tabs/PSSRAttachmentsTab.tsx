'use client';

import { useMemo, useState } from 'react';
import { usePSSRAttachmentMutations } from '../../hooks/usePSSRAttachmentMutations';
import { usePSSRAttachments } from '../../hooks/usePSSRAttachments';
import { PSSRAttachmentPreviewDrawer } from '../attachments/PSSRAttachmentPreviewDrawer';
import { PSSRAttachmentSummaryCard } from '../attachments/PSSRAttachmentSummaryCard';
import { PSSRAttachmentUploadPanel } from '../attachments/PSSRAttachmentUploadPanel';
import { PSSRAttachmentsTable } from '../attachments/PSSRAttachmentsTable';
import { PSSRLinkDocumentDialog } from '../attachments/PSSRLinkDocumentDialog';
import { AuthorizationHistory } from '../authorization/AuthorizationHistory';
import { ErrorState, LoadingState } from '../pssr-ui';

export function PSSRAttachmentsTab({ pssr }: { pssr: any }) {
  const query = usePSSRAttachments(pssr.id);
  const mutations = usePSSRAttachmentMutations(pssr.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => (query.data?.attachments ?? []).find((item: any) => item.id === selectedId) ?? query.data?.attachments?.[0], [query.data, selectedId]);
  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message="Unable to load PSSR attachments from API." />;
  const data = query.data ?? {};
  return (
    <div className="space-y-4">
      <PSSRAttachmentSummaryCard summary={data.summary} />
      <PSSRAttachmentUploadPanel onUpload={() => mutations.upload.mutate({ fileName: `PSSR-${pssr.pssr_number ?? pssr.id}-supporting-evidence.pdf`, attachmentType: 'Startup evidence', description: 'Supporting startup authorization evidence uploaded from attachments tab.', mimeType: 'application/pdf', fileSize: 0 })} />
      <PSSRAttachmentsTable attachments={data.attachments ?? []} onPreview={(id) => { setSelectedId(id); mutations.preview.mutate(id); }} onDownload={(id) => mutations.download.mutate(id)} onDelete={(id) => mutations.delete.mutate(id)} />
      <div className="grid gap-4 xl:grid-cols-3">
        <PSSRAttachmentPreviewDrawer attachment={selected} />
        <PSSRLinkDocumentDialog selected={selected} />
        <AuthorizationHistory history={data.history ?? []} />
      </div>
    </div>
  );
}
