import { CertificateStatusBadge } from '../shared/CertificateStatusBadge';

export function CalibrationCertificatePanel({ record }: { record?: Record<string, unknown> }) {
  const status = record?.calibration_certificate_document_id ? 'Certificate Linked' : 'Certificate Missing';
  return <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><h2 className="font-semibold">Calibration Certificate</h2><div className="mt-3"><CertificateStatusBadge value={status} /></div><p className="mt-3 text-sm text-[var(--psm-muted)]">Certificate document: {String(record?.calibration_certificate_document_id ?? 'Not linked')}</p></section>;
}

