import { SectionShell } from './section-utils';

export function ReliefCertificatesSection({ certificates }: { certificates?: Array<Record<string, unknown>> | undefined }) {
  return (
    <SectionShell title="Certificates / Documents" description="Certificate linkage uses Document Control/storage metadata and does not duplicate controlled documents.">
      <div className="md:col-span-2 xl:col-span-3">
        {(certificates ?? []).length ? (
          <div className="space-y-2">
            {(certificates ?? []).map((certificate) => (
              <div key={String(certificate.id)} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm">
                <span className="font-semibold">{String(certificate.certificate_number ?? certificate.title ?? 'Certificate')}</span>
                <span className="ml-3 text-[var(--psm-muted)]">{String(certificate.status ?? 'Linked')}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-[var(--psm-muted)]">No certificates linked yet.</p>}
      </div>
    </SectionShell>
  );
}
