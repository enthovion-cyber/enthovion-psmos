import type { FoundationEntity } from '@/services/foundation.service';
import { WorkspaceStatusBadge } from '../shared/WorkspaceStatusBadge';

export function CompanyProfileCard({ company }: { company: FoundationEntity | undefined }) {
  return (
    <section className="psm-card p-5">
      <h2 className="text-lg font-semibold">Company Profile</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Info label="Legal company name" value={company?.legalName ?? company?.name} />
        <Info label="Company code / slug" value={company?.code ?? company?.slug} />
        <Info label="Industry" value={company?.industry} />
        <Info label="Country" value={company?.country} />
        <Info label="Timezone" value={company?.timezone} />
        <Info label="Currency" value={company?.currency} />
        <Info label="Phone" value={company?.phone} />
        <Info label="Website" value={company?.website} />
        <div><div className="text-xs text-[var(--psm-muted)]">Status</div><div className="mt-1"><WorkspaceStatusBadge status={company?.status} /></div></div>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string | null | undefined }) {
  return <div><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-1 font-medium">{value || '-'}</div></div>;
}
