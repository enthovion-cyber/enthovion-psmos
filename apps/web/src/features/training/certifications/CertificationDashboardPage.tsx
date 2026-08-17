'use client';

import { useCertificationDashboard } from '../hooks/useCertifications';
import { TrainingButton, TrainingErrorState, TrainingLoadingState, TrainingMetricCard } from '../shared/TrainingUi';
import { CertificateExpiryTable } from './CertificateExpiryTable';

export function CertificationDashboardPage() {
  const query = useCertificationDashboard();
  if (query.isLoading) return <TrainingLoadingState rows={6} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const summary = query.data?.summary;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--psm-fg)]">Certifications + Expiry Tracking</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Certificate evidence, verification, renewals, and matrix/competency blockers from real backend data.</p>
        </div>
        <div className="flex gap-2"><TrainingButton href="/training-competency/certifications/new">New Certificate</TrainingButton><TrainingButton href="/training-competency/certifications/register" variant="secondary">Register</TrainingButton></div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <TrainingMetricCard label="Total Certificates" value={summary?.totalCertificates ?? 0} />
        <TrainingMetricCard label="Current" value={summary?.current ?? 0} tone="good" />
        <TrainingMetricCard label="Expiring Soon" value={summary?.expiringSoon ?? 0} tone="warn" href="/training-competency/certifications/expiring" />
        <TrainingMetricCard label="Expired" value={summary?.expired ?? 0} tone="danger" href="/training-competency/certifications/expired" />
        <TrainingMetricCard label="Pending Verification" value={summary?.pendingVerification ?? 0} tone="warn" href="/training-competency/certifications/pending-verification" />
        <TrainingMetricCard label="Missing Required" value={summary?.missingRequired ?? 0} tone="danger" href="/training-competency/certifications/missing" />
        <TrainingMetricCard label="Rejected" value={summary?.rejected ?? 0} tone="danger" />
        <TrainingMetricCard label="Revoked" value={summary?.revoked ?? 0} tone="danger" />
        <TrainingMetricCard label="Safety-Critical" value={summary?.safetyCritical ?? 0} tone="warn" href="/training-competency/certifications/safety-critical" />
        <TrainingMetricCard label="Without Evidence" value={summary?.withoutEvidence ?? 0} tone="danger" />
        <TrainingMetricCard label="PTW-Critical Gaps" value={summary?.ptwCriticalGaps ?? 0} tone="danger" />
        <TrainingMetricCard label="MOC Blockers" value={summary?.mocBlockers ?? 0} tone="danger" />
        <TrainingMetricCard label="PSSR Blockers" value={summary?.pssrBlockers ?? 0} tone="danger" />
        <TrainingMetricCard label="Renewals Due" value={summary?.renewalsDue ?? 0} tone="warn" />
        <TrainingMetricCard label="Competency Gaps" value={summary?.competencyGaps ?? 0} tone="warn" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <CertificateExpiryTable title="Expiring Certificates" rows={query.data?.expiring ?? []} />
        <CertificateExpiryTable title="Pending Verification" rows={query.data?.pendingVerification ?? []} />
        <CertificateExpiryTable title="Safety-Critical Gaps" rows={query.data?.safetyCriticalGaps ?? []} />
      </div>
    </div>
  );
}
