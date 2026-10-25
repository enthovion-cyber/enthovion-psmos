'use client';

import { Link2 } from 'lucide-react';
import { DetailCard, Field, MocButton, detailInput } from '../moc-detail-ui';

export function MOCLinkDocumentDialog({ draft, setDraft, onLink, isLinking }: any) {
  return (
    <DetailCard title="Link Controlled Document">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Field label="Document ID">
          <input className={detailInput} value={draft.documentId ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, documentId: e.target.value }))} placeholder="Document record ID" />
        </Field>
        <Field label="Document Version ID">
          <input className={detailInput} value={draft.documentVersionId ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, documentVersionId: e.target.value }))} placeholder="Optional version ID" />
        </Field>
        <div className="flex items-end">
          <MocButton
            variant="primary"
            disabled={isLinking || !draft.documentId}
            onClick={onLink}
            icon={<Link2 className="h-4 w-4" />}
          >
            Link
          </MocButton>
        </div>
      </div>
    </DetailCard>
  );
}
