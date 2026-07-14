'use client';

import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useMySignatureProfile, useSignatureMutations } from '../hooks/useSignatures';
import type { SignSignatureInput, SignatureContext } from '../services/signature.service';
import { SignatureAuthConfirm } from './SignatureAuthConfirm';
import { SignaturePreview } from './SignaturePreview';

export function SignatureDialog({ context, onClose, onSigned }: { context: SignatureContext | null; onClose: () => void; onSigned?: () => void }) {
  const profile = useMySignatureProfile();
  const mutations = useSignatureMutations(context ? { moduleName: context.moduleName, recordType: context.recordType, recordId: context.recordId } : undefined);
  const [usernameReentry, setUsernameReentry] = useState('');
  const [passwordOrPin, setPasswordOrPin] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'pin'>('pin');
  const [comment, setComment] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!context) return null;

  async function submit() {
    const activeContext = context;
    if (!activeContext) return;
    if (!confirmed) {
      setError('Confirm the electronic signature declaration before signing.');
      return;
    }
    try {
      const payload: SignSignatureInput = {
        moduleName: activeContext.moduleName,
        recordType: activeContext.recordType,
        recordId: activeContext.recordId,
        actionType: activeContext.actionType,
        signatureRole: activeContext.signatureRole,
        authMethod,
        usernameReentry,
        passwordOrPin,
        ...(activeContext.recordNumber ? { recordNumber: activeContext.recordNumber } : {}),
        ...(activeContext.declarationText ? { declarationText: activeContext.declarationText } : {}),
        ...(activeContext.metadata ? { metadata: activeContext.metadata } : {}),
        ...(comment ? { comment } : {})
      };
      await mutations.sign.mutateAsync(payload);
      onSigned?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signature failed');
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
      <section className="psm-card max-h-[92vh] w-full max-w-2xl overflow-auto">
        <div className="flex items-start justify-between border-b border-[var(--psm-line)] p-5">
          <div>
            <h2 className="text-xl font-semibold">Electronic Signature Confirmation</h2>
            <p className="mt-1 text-sm text-[var(--psm-muted)]">{context.moduleName} · {context.recordNumber ?? context.recordId} · {context.actionType}</p>
          </div>
          <button className="rounded-md p-2 text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">
              <div className="font-semibold text-success">Saved signature selected automatically</div>
              <div className="mt-1 text-[var(--psm-muted)]">
                {profile.data ? `${profile.data.full_name} · ${profile.data.signature_method}` : 'Create and verify a signature profile before signing.'}
              </div>
            </div>
            <Info label="Signature role" value={context.signatureRole} />
            <Info label="Record type" value={context.recordType} />
            <div className="rounded-lg border border-info/30 bg-info/10 p-4 text-sm">
              {context.declarationText ?? 'I understand this electronic signature is equivalent to my handwritten signature for this system record.'}
            </div>
            <SignatureAuthConfirm
              authMethod={authMethod}
              comment={comment}
              confirmed={confirmed}
              passwordOrPin={passwordOrPin}
              setAuthMethod={setAuthMethod}
              setComment={setComment}
              setConfirmed={setConfirmed}
              setPasswordOrPin={setPasswordOrPin}
              setUsernameReentry={setUsernameReentry}
              usernameReentry={usernameReentry}
            />
            {error ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}
          </div>
          <SignaturePreview profile={profile.data} />
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--psm-line)] p-5">
          <button className="psm-button psm-button-secondary" onClick={onClose}>Cancel</button>
          <button className="psm-button psm-button-primary" disabled={mutations.sign.isPending || !profile.data || profile.data.status !== 'Active'} onClick={submit}>
            <ShieldCheck size={16} /> {mutations.sign.isPending ? 'Signing...' : 'Sign Electronically'}
          </button>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 text-sm"><span className="text-[var(--psm-muted)]">{label}</span><span className="font-semibold">{value}</span></div>;
}
