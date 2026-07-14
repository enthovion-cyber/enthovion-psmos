'use client';

import { Link2 } from 'lucide-react';
import { DetailCard, Field, detailInput } from '../moc-detail-ui';

export function MOCLinkDocumentDialog({ draft, setDraft, onLink, isLinking }: any) {
  return (
    <DetailCard title="Link Controlled Document">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Document ID"><input className={detailInput} value={draft.documentId ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, documentId: e.target.value }))} placeholder="Document record ID" /></Field>
        <Field label="Document Version ID"><input className={detailInput} value={draft.documentVersionId ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, documentVersionId: e.target.value }))} placeholder="Optional version ID" /></Field>
        <div className="flex items-end">
          <button disabled={isLinking || !draft.documentId} className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 px-3 text-xs font-black text-slate-100 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50" onClick={onLink}><Link2 className="h-4 w-4" /> Link</button>
        </div>
      </div>
    </DetailCard>
  );
}
