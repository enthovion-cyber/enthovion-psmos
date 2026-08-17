import { PsiCard } from '../shared/PsiUi';
import { SelectInput, TextInput, Toggle } from './SafeguardPrimitives';

const typeOptions = ['Basic process control system', 'Alarm with operator response', 'Critical alarm', 'Interlock', 'SIF / SIS', 'PSV / PRV / rupture disk', 'Relief / vent / flare system', 'Fire and gas detection', 'Procedure / SOP', 'PTW / LOTO control', 'Emergency response plan', 'Other'];
const functionOptions = ['Prevent initiation', 'Detect deviation', 'Control deviation', 'Isolate source', 'Depressurize', 'Relieve pressure', 'Contain release', 'Reduce consequence', 'Warn operator', 'Shutdown process', 'Prevent ignition', 'Prevent exposure', 'Emergency response', 'Verify readiness', 'Other'];

export function SafeguardFilters({ filters, onChange, savedViews }: { filters: Record<string, unknown>; onChange: (filters: Record<string, unknown>) => void; savedViews: string[] }) {
  const patch = (value: Record<string, unknown>) => onChange({ ...filters, page: 1, ...value });
  return (
    <PsiCard title="Filters / Search" subtitle="Server-side search, filtering, sorting, and saved views for safeguards and controls.">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TextInput label="Search name / tag / function" value={filters.search} onChange={(search) => patch({ search })} />
        <TextInput label="Site" value={filters.siteId} onChange={(siteId) => patch({ siteId })} />
        <TextInput label="Unit" value={filters.unitId} onChange={(unitId) => patch({ unitId })} />
        <TextInput label="Area" value={filters.areaId} onChange={(areaId) => patch({ areaId })} />
        <TextInput label="Equipment" value={filters.equipmentId} onChange={(equipmentId) => patch({ equipmentId })} />
        <SelectInput label="Safeguard type" value={filters.safeguardType} options={typeOptions} onChange={(safeguardType) => patch({ safeguardType })} />
        <SelectInput label="Function type" value={filters.functionType} options={functionOptions} onChange={(functionType) => patch({ functionType })} />
        <SelectInput label="Criticality" value={filters.criticality} options={['Low', 'Medium', 'High', 'Critical']} onChange={(criticality) => patch({ criticality })} />
        <SelectInput label="Status" value={filters.status} options={['Draft', 'Active', 'Pending Review', 'Approved', 'Rejected', 'Archived']} onChange={(status) => patch({ status })} />
        <SelectInput label="Sort" value={filters.sort ?? 'updated_at.desc'} options={['updated_at.desc', 'updated_at.asc', 'safeguard_title.asc', 'criticality.desc', 'next_review_due.asc']} onChange={(sort) => patch({ sort })} />
        <Toggle label="Critical only" checked={filters.critical === 'true'} onChange={(enabled) => patch({ critical: enabled ? 'true' : undefined })} />
        <Toggle label="MOC required" checked={filters.mocRequired === 'true'} onChange={(enabled) => patch({ mocRequired: enabled ? 'true' : undefined })} />
        <Toggle label="PSSR blockers" checked={filters.pssrBlockers === 'true'} onChange={(enabled) => patch({ pssrBlockers: enabled ? 'true' : undefined })} />
        <Toggle label="Bypassed / impaired" checked={filters.bypassedImpaired === 'true'} onChange={(enabled) => patch({ bypassedImpaired: enabled ? 'true' : undefined })} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{savedViews.map((view) => <button key={view} type="button" onClick={() => patch(view === 'Critical Safeguards' ? { critical: 'true' } : view === 'Missing Safeguards' ? { missing: 'true' } : view === 'Conflicts' ? { conflicts: 'true' } : view === 'PSSR Blockers' ? { pssrBlockers: 'true' } : {})} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1 text-xs font-semibold">{view}</button>)}</div>
    </PsiCard>
  );
}
