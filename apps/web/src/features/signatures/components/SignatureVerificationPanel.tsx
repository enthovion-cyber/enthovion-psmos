'use client';

import { ShieldCheck } from 'lucide-react';
import type { SignatureProfile } from '../services/signature.service';

export function SignatureVerificationPanel({ profile, onVerify, onDisable, busy }: { profile?: SignatureProfile | null | undefined; onVerify: () => void | Promise<void>; onDisable: () => void | Promise<void>; busy?: boolean | undefined }) {
  return (
    <section className="psm-card p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-success" size={18} />
        <h3 className="font-semibold">Verification</h3>
      </div>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">A signature profile must be verified before it can be used by PTW, MOC, PSSR, or future modules.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="psm-button psm-button-primary" disabled={!profile || busy || profile.status === 'Active'} onClick={onVerify}>Verify Profile</button>
        <button className="psm-button psm-button-secondary" disabled={!profile || busy || profile.status === 'Disabled'} onClick={onDisable}>Disable</button>
      </div>
    </section>
  );
}
