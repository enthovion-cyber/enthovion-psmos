import type { SignatureRequirement } from '../services/signature.service';
import { SignatureDeclaration } from './SignatureDeclaration';

export function SignatureRequirementList({ requirements }: { requirements?: SignatureRequirement[] }) {
  return (
    <div className="grid gap-3">
      {(requirements ?? []).map((requirement) => (
        <div key={requirement.id} className="rounded-lg border border-[var(--psm-line)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-semibold">{requirement.sequence_order}. {requirement.signature_role}</div>
            <div className="text-xs text-[var(--psm-muted)]">{requirement.required_permission ?? 'signature.sign'}</div>
          </div>
          <div className="mt-2"><SignatureDeclaration text={requirement.declaration_text} /></div>
        </div>
      ))}
      {!(requirements ?? []).length ? <div className="text-sm text-[var(--psm-muted)]">No signature requirements configured.</div> : null}
    </div>
  );
}
