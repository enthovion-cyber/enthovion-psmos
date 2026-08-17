'use client';

import { useCertificateDetail } from '../hooks/useCertificateDetail';
import { CertificateExpiryBadge } from '../shared/CertificateExpiryBadge';
import { CertificateVerificationBadge } from '../shared/CertificateVerificationBadge';
import { TrainingButton, TrainingCard, TrainingErrorState, TrainingLoadingState, TrainingMetricCard } from '../shared/TrainingUi';
import { CertificateEvidencePanel } from './CertificateEvidencePanel';
import { CertificateRenewalPanel } from './CertificateRenewalPanel';
import { CertificateVerificationPanel } from './CertificateVerificationPanel';

export function CertificateDetailPage({ certificateId }: { certificateId: string }) {
  const query = useCertificateDetail(certificateId);
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const certificate = query.data?.certificate;
  if (!certificate) return <TrainingErrorState message="Certificate was not found." />;
  return <div className="space-y-6"><header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{certificate.certificate_title}</h1><p className="text-sm text-[var(--psm-muted)]">{certificate.certificate_number ?? certificate.certificate_code ?? 'No certificate number'} - worker {certificate.worker_id}</p></div><div className="flex gap-2"><TrainingButton href={`/training-competency/certifications/${certificate.id}/edit`} variant="secondary">Edit</TrainingButton><TrainingButton href="/training-competency/certifications/register" variant="secondary">Register</TrainingButton></div></header><div className="grid gap-4 md:grid-cols-4"><TrainingMetricCard label="Runtime status" value={<CertificateExpiryBadge status={query.data?.runtimeStatus} />} /><TrainingMetricCard label="Verification" value={<CertificateVerificationBadge status={certificate.verification_status} />} /><TrainingMetricCard label="Evidence" value={certificate.evidence_status} /><TrainingMetricCard label="Expiry" value={certificate.no_expiry ? 'No expiry' : certificate.expiry_date ?? 'Missing'} /></div><div className="grid gap-4 xl:grid-cols-3"><CertificateVerificationPanel certificate={certificate} /><CertificateEvidencePanel documents={query.data?.documents ?? []} /><CertificateRenewalPanel certificate={certificate} renewals={query.data?.renewals ?? []} /></div><TrainingCard title="History"><div className="space-y-2 text-sm">{(query.data?.history ?? []).map((event) => <div key={String(event.id)} className="rounded-lg border border-[var(--psm-line)] p-3"><b>{String(event.event_type)}</b> {String(event.event_title)}<p className="text-xs text-[var(--psm-muted)]">{String(event.created_at ?? '')}</p></div>)}</div></TrainingCard></div>;
}
