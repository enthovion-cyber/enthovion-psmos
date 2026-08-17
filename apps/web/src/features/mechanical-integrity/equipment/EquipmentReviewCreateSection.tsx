import type { EquipmentFormState } from './EquipmentForm';

export function EquipmentReviewCreateSection({ values, missing, mode }: { values: EquipmentFormState; missing: string[]; mode: 'create' | 'edit' }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Review & {mode === 'create' ? 'Create' : 'Save'}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Summary label="Tag" value={values.tag} />
        <Summary label="Name" value={values.name} />
        <Summary label="Type" value={values.type} />
        <Summary label="Site" value={values.siteId} />
        <Summary label="Unit" value={values.unitId} />
        <Summary label="Criticality" value={values.criticality} />
      </div>
      <div className={`mt-4 rounded-lg border p-3 text-sm ${missing.length ? 'border-warning/30 bg-warning/10 text-warning' : 'border-success/30 bg-success/10 text-success'}`}>{missing.length ? `Missing required data: ${missing.join(', ')}` : 'Required fields complete. Duplicate tag validation is enforced by backend.'}</div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value?: string }) {
  return <div className="rounded-lg border border-[var(--psm-line)] p-3"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-1 font-semibold">{value || '-'}</div></div>;
}
