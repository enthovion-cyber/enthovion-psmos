import type { ReactNode } from 'react';
import { PermitActionPanel } from '../PermitActionPanel';

export function PermitDetailsTab({ permit, onCreateMoc, onSaveTemplate }: { permit: any; onCreateMoc: () => void; onSaveTemplate: () => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <section className="psm-card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Permit Details</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Info label="Work Description" value={permit.work_description} />
          <Info label="Permit Type" value={permit.permit_type} />
          <Info label="Status" value={permit.status} />
          <Info label="Risk Level" value={permit.risk_level} />
          <Info label="Site" value={permit.site?.name ?? '-'} />
          <Info label="Unit" value={permit.unit?.name ?? '-'} />
          <Info label="Area" value={permit.area?.name ?? '-'} />
          <Info label="Location" value={permit.location ?? permit.job_area ?? '-'} />
          <Info label="Equipment" value={`${permit.equipment_tag ?? '-'} ${permit.equipment_name ?? ''}`} />
          <Info label="Start" value={new Date(permit.planned_start_at).toLocaleString()} />
          <Info label="Expiry" value={new Date(permit.planned_end_at).toLocaleString()} />
          <Info label="Issuer" value={permit.issuer?.displayName ?? '-'} />
        </div>
      </section>
      <PermitActionPanel permit={permit} onCreateMoc={onCreateMoc} onSaveTemplate={onSaveTemplate} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-lg bg-[var(--psm-surface-2)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>;
}
