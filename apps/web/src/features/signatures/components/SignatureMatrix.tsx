'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useMySignatureProfile, useRecordSignatures, useSignatureRequirements } from '../hooks/useSignatures';
import type { ElectronicSignature, SignatureContext, SignatureRequirement } from '../services/signature.service';
import { SignatureDialog } from './SignatureDialog';
import { SignatureStatusBadge } from './SignatureStatusBadge';

export function SignatureMatrix({ context, title = 'Required Electronic Signatures' }: { context: Pick<SignatureContext, 'moduleName' | 'recordType' | 'recordId' | 'recordNumber' | 'actionType'>; title?: string }) {
  const requirements = useSignatureRequirements({ moduleName: context.moduleName, recordType: context.recordType, actionType: context.actionType });
  const signatures = useRecordSignatures(context);
  const profile = useMySignatureProfile();
  const [signing, setSigning] = useState<SignatureContext | null>(null);
  const signedByKey = useMemo(() => new Map<string, ElectronicSignature>((signatures.data ?? []).map((signature: ElectronicSignature) => [`${signature.action_type}:${signature.signature_role}`, signature])), [signatures.data]);
  const requiredCount = requirements.data?.length ?? 0;
  const signedCount = requirements.data?.filter((requirement) => signedByKey.has(`${requirement.action_type}:${requirement.signature_role}`)).length ?? 0;
  const ready = profile.data?.status === 'Active';

  return (
    <section className="psm-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">Universal E-Signature Engine · {signedCount}/{requiredCount} complete · saved profile auto-selected</p>
        </div>
        {ready ? <ShieldCheck className="text-success" size={20} /> : <AlertTriangle className="text-warning" size={20} />}
      </div>
      {!ready ? (
        <div className="border-b border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning">
          Create and verify your saved signature profile before signing. <a href="/settings/signature" className="font-semibold underline">Open signature settings</a>
        </div>
      ) : null}
      <div className="overflow-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Sequence</th>
              <th className="px-4 py-3">Declaration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Signed By</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {(requirements.data ?? []).map((requirement: SignatureRequirement) => {
              const signature = signedByKey.get(`${requirement.action_type}:${requirement.signature_role}`);
              return (
                <tr key={requirement.id} className="border-t border-[var(--psm-line)]">
                  <td className="px-4 py-3 font-semibold">{requirement.signature_role}</td>
                  <td className="px-4 py-3">{requirement.sequence_order}</td>
                  <td className="max-w-md px-4 py-3 text-xs text-[var(--psm-muted)]">{requirement.declaration_text}</td>
                  <td className="px-4 py-3"><SignatureStatusBadge status={signature?.status ?? 'Pending'} /></td>
                  <td className="px-4 py-3 text-xs">{signature ? <><div className="font-semibold">{signature.signer_full_name}</div><div className="text-[var(--psm-muted)]">{new Date(signature.signed_at).toLocaleString()}</div></> : '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      className="psm-button psm-button-secondary min-h-8 px-3 text-xs"
                      disabled={Boolean(signature) || !ready}
                      onClick={() => setSigning({ ...context, signatureRole: requirement.signature_role, declarationText: requirement.declaration_text })}
                    >
                      {signature ? 'Signed' : 'Select Signature'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!requirements.isLoading && !(requirements.data ?? []).length ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-[var(--psm-muted)]">No signature requirements configured for this action.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <SignatureDialog context={signing} onClose={() => setSigning(null)} onSigned={() => signatures.refetch()} />
    </section>
  );
}
