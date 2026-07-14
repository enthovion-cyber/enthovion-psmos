import type { ElectronicSignature } from '../services/signature.service';
import { SignatureStatusBadge } from './SignatureStatusBadge';

export function SignatureHistoryTimeline({ signatures }: { signatures?: ElectronicSignature[] }) {
  return (
    <div className="space-y-3">
      {(signatures ?? []).map((signature) => (
        <div key={signature.id} className="relative rounded-lg border border-[var(--psm-line)] p-3 pl-8">
          <span className="absolute left-3 top-4 h-2.5 w-2.5 rounded-full bg-success" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold">{signature.signature_role}</div>
            <SignatureStatusBadge status={signature.status} />
          </div>
          <div className="mt-1 text-xs text-[var(--psm-muted)]">{signature.signer_full_name} · {new Date(signature.signed_at).toLocaleString()}</div>
          <div className="mt-1 break-all text-xs text-[var(--psm-muted)]">{signature.signature_hash}</div>
        </div>
      ))}
      {!(signatures ?? []).length ? <div className="text-sm text-[var(--psm-muted)]">No signature history yet.</div> : null}
    </div>
  );
}
