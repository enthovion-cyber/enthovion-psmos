import { TrainingCard } from '../../shared/TrainingUi';

export function WorkerAssignmentSection({ value, onChange, context }: { value: Record<string, any>; onChange: (next: Record<string, any>) => void; context?: Record<string, any> }) {
  const sites = Array.isArray(context?.sites) ? context.sites : [];
  const units = Array.isArray(context?.units) ? context.units : [];
  const areas = Array.isArray(context?.areas) ? context.areas : [];
  const patch = (key: string, next: any) => onChange({ [key]: next });
  return (
    <TrainingCard title="3. Site / Unit / Area Assignment" subtitle="Assignments use the existing company, site, unit, and area foundation. No IAM access is silently granted.">
      <div className="grid gap-3 md:grid-cols-2">
        <Select label="Primary site" value={value.primarySiteId ?? ''} items={sites.map((site: any) => ({ id: site.id, label: `${site.name} (${site.code ?? site.id})` }))} onChange={(v) => patch('primarySiteId', v)} />
        <Select label="Primary unit" value={value.assignment?.unitId ?? ''} items={units.map((unit: any) => ({ id: unit.id, label: `${unit.name} (${unit.code ?? unit.id})` }))} onChange={(v) => patch('assignment', { ...(value.assignment ?? {}), unitId: v })} />
        <Select label="Primary area" value={value.assignment?.areaId ?? ''} items={areas.map((area: any) => ({ id: area.id, label: `${area.name} (${area.code ?? area.id})` }))} onChange={(v) => patch('assignment', { ...(value.assignment ?? {}), areaId: v })} />
        <Select label="Assignment status" value={value.assignment?.assignmentStatus ?? 'Active'} items={['Active', 'Pending', 'Temporary', 'Expired', 'Suspended', 'Removed'].map((id) => ({ id, label: id }))} onChange={(v) => patch('assignment', { ...(value.assignment ?? {}), assignmentStatus: v })} />
        <Field label="Assignment start date" type="date" value={value.assignment?.assignmentStartDate} onChange={(v) => patch('assignment', { ...(value.assignment ?? {}), assignmentStartDate: v })} />
        <Field label="Assignment end date" type="date" value={value.assignment?.assignmentEndDate} onChange={(v) => patch('assignment', { ...(value.assignment ?? {}), assignmentEndDate: v })} />
        <Field label="Assignment reason" value={value.assignment?.assignmentReason} onChange={(v) => patch('assignment', { ...(value.assignment ?? {}), assignmentReason: v })} />
      </div>
    </TrainingCard>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (value: string) => void; type?: string }) {
  return <label className="text-sm"><span className="mb-1 block font-semibold">{label}</span><input type={type} className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, items, onChange }: { label: string; value: string; items: Array<{ id: string; label: string }>; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1 block font-semibold">{label}</span><select className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}><option value="">Select {label}</option>{items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>;
}
