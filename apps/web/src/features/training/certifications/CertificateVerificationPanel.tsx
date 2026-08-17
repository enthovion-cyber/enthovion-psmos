'use client';

import { useState } from 'react';
import { useCertificateMutations } from '../hooks/useCertificateMutations';
import { CertificateVerificationBadge } from '../shared/CertificateVerificationBadge';
import { TrainingButton, TrainingCard, formatTrainingError } from '../shared/TrainingUi';
import type { TrainingCertificate } from '../types/certification.types';

export function CertificateVerificationPanel({ certificate }: { certificate: TrainingCertificate }) {
  const mutations = useCertificateMutations(certificate.id);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const run = async (action: 'verify' | 'reject' | 'revoke') => {
    setError(null);
    try {
      if (action === 'verify') await mutations.verify.mutateAsync({ reason });
      if (action === 'reject') await mutations.reject.mutateAsync({ reason });
      if (action === 'revoke') await mutations.revoke.mutateAsync({ reason });
    } catch (err) { setError(formatTrainingError(err)); }
  };
  return <TrainingCard title="Verification" subtitle="Verification decisions create audit and history events and update worker/matrix status."><div className="flex flex-wrap items-center gap-3"><CertificateVerificationBadge status={certificate.verification_status} /><span className="text-sm text-[var(--psm-muted)]">Evidence: {certificate.evidence_status}</span></div><textarea className="mt-4 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm" placeholder="Decision reason / verification notes" value={reason} onChange={(event) => setReason(event.target.value)} />{error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}<div className="mt-4 flex flex-wrap gap-2"><TrainingButton onClick={() => run('verify')} disabled={mutations.verify.isPending}>Verify</TrainingButton><TrainingButton variant="secondary" onClick={() => run('reject')} disabled={!reason || mutations.reject.isPending} title={!reason ? 'Rejection requires a reason.' : undefined}>Reject</TrainingButton><TrainingButton variant="danger" onClick={() => run('revoke')} disabled={!reason || mutations.revoke.isPending} title={!reason ? 'Revocation requires a reason.' : undefined}>Revoke</TrainingButton></div></TrainingCard>;
}
