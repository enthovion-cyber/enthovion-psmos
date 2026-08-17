'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCertifications, useFilteredCertifications } from '../hooks/useCertifications';
import { CertificateExpiryBadge } from '../shared/CertificateExpiryBadge';
import { CertificateVerificationBadge } from '../shared/CertificateVerificationBadge';
import { TrainingButton, TrainingCard, TrainingEmptyState, TrainingErrorState, TrainingLoadingState } from '../shared/TrainingUi';

export function CertificationRegisterPage({ view }: { view?: 'expiring' | 'expired' | 'missing' | 'pending-verification' | 'rejected' | 'safety-critical' }) {
  const [search, setSearch] = useState('');
  const query = view ? useFilteredCertifications(view, { search }) : useCertifications({ search });
  if (query.isLoading) return <TrainingLoadingState rows={5} />;
  if (query.isError) return <TrainingErrorState message={query.error} onRetry={() => query.refetch()} />;
  const rows = query.data?.rows ?? [];
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Certificate Register</h1><p className="text-sm text-[var(--psm-muted)]">Search, filter, verify, renew, and track required certificate evidence.</p></div>
        <TrainingButton href="/training-competency/certifications/new">New Certificate</TrainingButton>
      </header>
      <TrainingCard>
        <input className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search certificate, worker, number, provider..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </TrainingCard>
      <TrainingCard title={view ? `${view.replace('-', ' ')} certificates` : 'All certificates'} subtitle={`${query.data?.total ?? 0} records`}>
        {!rows.length ? <TrainingEmptyState title="No certificate records" message="Create a certificate or adjust search filters." action={<TrainingButton href="/training-competency/certifications/new">Create Certificate</TrainingButton>} /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-[var(--psm-muted)]"><tr><th className="px-3 py-2">Certificate</th><th className="px-3 py-2">Worker</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Verification</th><th className="px-3 py-2">Expiry</th><th className="px-3 py-2">Criticality</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]"><td className="px-3 py-3 font-semibold"><Link href={`/training-competency/certifications/${row.id}`}>{row.certificate_title}</Link><p className="text-xs text-[var(--psm-muted)]">{row.certificate_number ?? row.certificate_code ?? 'No number'}</p></td><td className="px-3 py-3">{row.worker_id}</td><td className="px-3 py-3">{row.certificate_category}</td><td className="px-3 py-3"><CertificateVerificationBadge status={row.verification_status} /></td><td className="px-3 py-3"><CertificateExpiryBadge status={row.runtime_status ?? row.certificate_status} /></td><td className="px-3 py-3">{[row.safety_critical && 'Safety', row.ptw_critical && 'PTW', row.moc_critical && 'MOC', row.pssr_critical && 'PSSR'].filter(Boolean).join(', ') || 'Normal'}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </TrainingCard>
    </div>
  );
}
