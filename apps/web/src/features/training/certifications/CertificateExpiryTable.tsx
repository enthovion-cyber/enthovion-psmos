import Link from 'next/link';
import { CertificateExpiryBadge } from '../shared/CertificateExpiryBadge';
import { TrainingCard, TrainingEmptyState } from '../shared/TrainingUi';
import type { TrainingCertificate } from '../types/certification.types';

export function CertificateExpiryTable({ title, rows }: { title: string; rows: TrainingCertificate[] }) {
  return (
    <TrainingCard title={title} subtitle="Backend-calculated expiry and renewal state.">
      {!rows.length ? <TrainingEmptyState title="No certificates found" message="No certificate records match this view." /> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-[var(--psm-muted)]">
              <tr><th className="px-3 py-2">Certificate</th><th className="px-3 py-2">Worker</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Expiry</th><th className="px-3 py-2">Status</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--psm-line)]">
                  <td className="px-3 py-3 font-semibold"><Link href={`/training-competency/certifications/${row.id}`}>{row.certificate_title}</Link></td>
                  <td className="px-3 py-3">{row.worker_id}</td>
                  <td className="px-3 py-3">{row.certificate_category}</td>
                  <td className="px-3 py-3">{row.no_expiry ? 'No expiry' : row.expiry_date ?? 'Missing'}</td>
                  <td className="px-3 py-3"><CertificateExpiryBadge status={row.runtime_status ?? row.certificate_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TrainingCard>
  );
}
