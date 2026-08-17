'use client';

import { useState } from 'react';
import { useDrawingMutations } from '../hooks/useDrawingMutations';
import { PsiButton, PsiCard } from '../shared/PsiUi';

export function DocumentControlLinkDialog({ drawingId }: { drawingId: string }) {
  const mutations = useDrawingMutations(drawingId);
  const [documentId, setDocumentId] = useState('');
  const [status, setStatus] = useState('Approved');
  return (
    <PsiCard title="Link Document Control Document" subtitle="PSI stores metadata and snapshots only. File access, versions, status, and downloads remain in Document Control.">
      <div className="grid gap-3 md:grid-cols-4">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Document ID" value={documentId} onChange={(event) => setDocumentId(event.target.value)} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Document status" value={status} onChange={(event) => setStatus(event.target.value)} />
        <PsiButton disabled={!documentId || mutations.linkDocument.isPending} title={!documentId ? 'Document Control document is required.' : undefined} onClick={() => void mutations.linkDocument.mutateAsync({ document_id: documentId, document_status: status, current_approved: ['Approved', 'Current'].includes(status) })}>{mutations.linkDocument.isPending ? 'Linking...' : 'Link Document'}</PsiButton>
        <PsiButton variant="secondary" onClick={() => void mutations.syncDocumentStatus.mutateAsync()} disabled={mutations.syncDocumentStatus.isPending}>{mutations.syncDocumentStatus.isPending ? 'Syncing...' : 'Sync Status'}</PsiButton>
      </div>
    </PsiCard>
  );
}
