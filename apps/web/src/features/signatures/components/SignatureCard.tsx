import type { ElectronicSignature } from '../services/signature.service';
import { SignaturePreview } from './SignaturePreview';
import { SignatureStatusBadge } from './SignatureStatusBadge';

export function SignatureCard({ signature }: { signature: ElectronicSignature }) {
  return (
    <article className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{signature.signature_role}</div>
          <div className="text-xs text-[var(--psm-muted)]">{signature.signer_full_name} · {new Date(signature.signed_at).toLocaleString()}</div>
        </div>
        <SignatureStatusBadge status={signature.status} />
      </div>
      <div className="mt-3">
        <SignaturePreview signature={signature} />
      </div>
      <div className="mt-2 break-all text-xs text-[var(--psm-muted)]">Hash: {signature.signature_hash}</div>
    </article>
  );
}
