export function LopaDashboardFilters({ filters, onChange, onReset }: { filters: Record<string, any>; onChange: (patch: Record<string, any>) => void; onReset: () => void }) {
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Select label="Status" value={filters.status ?? ''} onChange={(status) => onChange({ status })} options={['', 'Draft', 'In Preparation', 'In Progress', 'Pending Review', 'Pending Approval', 'Approved', 'Closed', 'Cancelled']} />
        <Select label="Source" value={filters.source ?? ''} onChange={(source) => onChange({ source })} options={['', 'Manual', 'HAZOP/PHA', 'MOC', 'PSSR', 'Incident', 'Audit', 'Revalidation']} />
        <Select label="Calculation" value={filters.calculationStatus ?? ''} onChange={(calculationStatus) => onChange({ calculationStatus })} options={['', 'Not Started', 'Incomplete', 'Ready to Calculate', 'Calculated', 'Failed', 'Needs Review', 'Approved']} />
        <Select label="IPL Validation" value={filters.iplValidationStatus ?? ''} onChange={(iplValidationStatus) => onChange({ iplValidationStatus })} options={['', 'Not Started', 'Incomplete', 'Validated', 'Failed', 'Needs Review']} />
        <Select label="Target SIL" value={filters.targetSil ?? ''} onChange={(targetSil) => onChange({ targetSil })} options={['', 'SIL 1', 'SIL 2', 'SIL 3', 'SIL 4']} />
        <label className="flex items-center gap-2 rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-200"><input type="checkbox" checked={!!filters.overdue} onChange={(event) => onChange({ overdue: event.target.checked })} /> Overdue</label>
        <button onClick={onReset} className="lopa-button-secondary justify-center">Clear All</button>
      </div>
    </section>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1 text-xs text-slate-500">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-100 outline-none">
        {options.map((option) => <option key={option} value={option}>{option || 'All'}</option>)}
      </select>
    </label>
  );
}
