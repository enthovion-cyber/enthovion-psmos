import { ESignatureRequiredBadge } from '../shared/ESignatureRequiredBadge';
import { ReviewCard, EmptyPanel } from './ReviewApprovalPrimitives';
import type { MiApprovalDetailResponse } from '../types/review-approval.types';

export function ESignaturePanel({ detail }: { detail: MiApprovalDetailResponse }) {
  return (
    <ReviewCard title="E-Signature" description="Universal E-Signature records are shown here; signature records are immutable.">
      <div className="mb-3"><ESignatureRequiredBadge required={detail.approval.e_signature_required} /></div>
      {!detail.signatures?.length ? <EmptyPanel>{detail.approval.e_signature_required ? 'No e-signature has been completed yet.' : 'No e-signature required by current approval rule.'}</EmptyPanel> : (
        <div className="space-y-2">{detail.signatures.map((sig) => <div key={String(sig.id ?? sig.signature_id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><p className="font-semibold">{String(sig.meaning ?? sig.signature_meaning ?? 'Signed')}</p><p className="text-[var(--psm-muted)]">Signer {String(sig.signer_user_id ?? sig.signer ?? 'Unknown')} at {String(sig.signed_at ?? 'pending')}</p></div>)}</div>
      )}
    </ReviewCard>
  );
}
