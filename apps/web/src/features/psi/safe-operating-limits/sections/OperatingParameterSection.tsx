import { PsiCard } from '../../shared/PsiUi';

const dataSources = ['Field gauge', 'DCS', 'PLC', 'Analyzer', 'Laboratory analysis', 'Manual reading', 'Calculation', 'Vendor design data', 'Engineering document', 'Procedure', 'Other'];

export function OperatingParameterSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  return (
    <PsiCard title="2. Operating Parameter" subtitle="Measurement location, instrument/control tags, data source, monitoring frequency, and linked PSI basis records.">
      <div className="grid gap-3 md:grid-cols-3">
        <textarea value={value.parameter_description ?? ''} onChange={(e) => onChange({ parameter_description: e.target.value })} placeholder="Parameter description" className="min-h-20 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm md:col-span-3" />
        <input value={value.measurement_location ?? ''} onChange={(e) => onChange({ measurement_location: e.target.value })} placeholder="Measurement location" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.instrument_tag ?? ''} onChange={(e) => onChange({ instrument_tag: e.target.value })} placeholder="Instrument tag" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.dcs_plc_tag ?? ''} onChange={(e) => onChange({ dcs_plc_tag: e.target.value })} placeholder="DCS / PLC tag" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.analyzer_tag ?? ''} onChange={(e) => onChange({ analyzer_tag: e.target.value })} placeholder="Analyzer tag" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <select value={value.data_source ?? ''} onChange={(e) => onChange({ data_source: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">Data source</option>{dataSources.map((item) => <option key={item}>{item}</option>)}</select>
        <input required value={value.unit_of_measure ?? ''} onChange={(e) => onChange({ unit_of_measure: e.target.value })} placeholder="Unit of measure" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.monitoring_frequency ?? ''} onChange={(e) => onChange({ monitoring_frequency: e.target.value })} placeholder="Monitoring frequency" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(value.controlled_variable)} onChange={(e) => onChange({ controlled_variable: e.target.checked })} /> Controlled variable</label>
        <input value={value.manipulated_variable ?? ''} onChange={(e) => onChange({ manipulated_variable: e.target.value })} placeholder="Manipulated variable" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.related_process_chemistry_id ?? ''} onChange={(e) => onChange({ related_process_chemistry_id: e.target.value })} placeholder="Related process chemistry record" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.related_chemical_id ?? ''} onChange={(e) => onChange({ related_chemical_id: e.target.value })} placeholder="Related chemical" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.related_equipment_design_basis_id ?? ''} onChange={(e) => onChange({ related_equipment_design_basis_id: e.target.value })} placeholder="Related equipment design basis" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.related_relief_system_id ?? ''} onChange={(e) => onChange({ related_relief_system_id: e.target.value })} placeholder="Related relief system" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.related_procedure_document_id ?? ''} onChange={(e) => onChange({ related_procedure_document_id: e.target.value })} placeholder="Related SOP / procedure" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <input value={value.related_drawing_document_id ?? ''} onChange={(e) => onChange({ related_drawing_document_id: e.target.value })} placeholder="Related P&ID / drawing" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
      </div>
    </PsiCard>
  );
}
