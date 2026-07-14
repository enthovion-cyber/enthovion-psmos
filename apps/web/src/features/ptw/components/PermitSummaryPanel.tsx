import type { Permit } from '@/services/ptw.service';

export function PermitSummaryPanel({ permit }: { permit: Permit }) {
  return (
    <section className="psm-card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Permit Summary</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Metric label="Permit" value={permit.permit_number} />
        <Metric label="Type" value={permit.permit_type} />
        <Metric label="Status" value={permit.status} />
        <Metric label="Equipment" value={permit.equipment_tag ?? '-'} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-1 font-semibold">{value}</div></div>;
}
