'use client';

import { useState } from 'react';
import { useCertificateMutations } from '../hooks/useCertificateMutations';
import { TrainingButton, TrainingCard, formatTrainingError } from '../shared/TrainingUi';
import type { TrainingCertificate } from '../types/certification.types';

export function CertificateRenewalPanel({ certificate, renewals }: { certificate: TrainingCertificate; renewals: Array<Record<string, unknown>> }) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutations = useCertificateMutations(certificate.id);
  const renew = async () => { setError(null); try { await mutations.renew.mutateAsync({ notes }); } catch (err) { setError(formatTrainingError(err)); } };
  return <TrainingCard title="Renewal" subtitle="Renewal creates a preserved renewal record and never overwrites the old certificate."><div className="space-y-2 text-sm">{renewals.map((row) => <div key={String(row.id)} className="rounded-lg border border-[var(--psm-line)] p-3">{String(row.renewal_status)} - due {String(row.renewal_due_date ?? 'Not set')}</div>)}</div><textarea className="mt-4 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm" placeholder="Renewal notes" value={notes} onChange={(event) => setNotes(event.target.value)} />{error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}<div className="mt-4"><TrainingButton onClick={renew} disabled={mutations.renew.isPending}>Start Renewal</TrainingButton></div></TrainingCard>;
}
