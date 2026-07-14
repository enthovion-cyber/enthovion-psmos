'use client';

import { useEffect, useMemo, useState } from 'react';
import type { InitiatingEventLibraryRecord } from '../../../types/lopa-library.types';
import { inputClass, LibraryDialog, LibraryField, selectClass } from '../LibraryShared';

const categories = ['Control valve failure', 'Pump failure', 'Compressor failure', 'Operator error', 'Utility failure', 'External event', 'Instrument failure', 'Equipment/line failure', 'Heat exchanger failure', 'Relief system demand', 'Process upset', 'Human error', 'Other'];
const sourceTypes = ['IEC 61508', 'IEC 61511', 'OREDA', 'CCPS Guidelines', 'Company historical data', 'Site-specific reliability data', 'Vendor data', 'Engineering judgement', 'Other approved source'];
const confidence = ['Low', 'Medium', 'High'];

const initial = {
  event_code: '',
  event_name: '',
  description: '',
  event_category: 'Pump failure',
  failure_mode: '',
  equipment_type: '',
  subtype: '',
  service_application: '',
  base_frequency: '',
  frequency_unit: 'per year',
  low_frequency: '',
  high_frequency: '',
  confidence_level: 'Medium',
  source_type: 'Company historical data',
  source_reference: '',
  standard_reference: '',
  applicability_notes: '',
  exclusion_notes: '',
  scope: 'Corporate',
  site_modifier_allowed: false,
  default_site_modifier: '1',
  engineering_justification_required: false,
  engineering_justification: '',
  revision_notes: '',
  active: true
};

export function AddEditInitiatingEventDialog({
  open,
  record,
  isSaving,
  error,
  onClose,
  onSave
}: {
  open: boolean;
  record?: InitiatingEventLibraryRecord | null;
  isSaving?: boolean;
  error?: unknown;
  onClose: () => void;
  onSave: (values: Record<string, any>) => void;
}) {
  const defaults = useMemo(() => record ? { ...initial, ...record } : initial, [record]);
  const [values, setValues] = useState<Record<string, any>>(defaults);
  useEffect(() => setValues(defaults), [defaults, open]);
  const set = (key: string, value: any) => setValues((current) => ({ ...current, [key]: value }));
  const submit = () => {
    onSave({
      ...values,
      base_frequency: Number(values.base_frequency),
      low_frequency: values.low_frequency === '' ? undefined : Number(values.low_frequency),
      high_frequency: values.high_frequency === '' ? undefined : Number(values.high_frequency),
      default_site_modifier: Number(values.default_site_modifier || 1)
    });
  };
  return (
    <LibraryDialog open={open} onClose={onClose} title={record ? 'Edit Initiating Event' : 'Add Initiating Event'} subtitle="Frequency records require source references, uncertainty ranges where available, approval status, and engineering justification where policy requires.">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LibraryField label="Event code *"><input className={inputClass} value={values.event_code ?? ''} onChange={(event) => set('event_code', event.target.value)} /></LibraryField>
        <LibraryField label="Event name *"><input className={inputClass} value={values.event_name ?? ''} onChange={(event) => set('event_name', event.target.value)} /></LibraryField>
        <LibraryField label="Category *"><select className={selectClass} value={values.event_category ?? ''} onChange={(event) => set('event_category', event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></LibraryField>
        <LibraryField label="Failure mode"><input className={inputClass} value={values.failure_mode ?? ''} onChange={(event) => set('failure_mode', event.target.value)} /></LibraryField>
        <LibraryField label="Equipment type"><input className={inputClass} value={values.equipment_type ?? ''} onChange={(event) => set('equipment_type', event.target.value)} /></LibraryField>
        <LibraryField label="Subtype"><input className={inputClass} value={values.subtype ?? ''} onChange={(event) => set('subtype', event.target.value)} /></LibraryField>
        <LibraryField label="Base frequency *"><input type="number" step="any" min="0" className={inputClass} value={values.base_frequency ?? ''} onChange={(event) => set('base_frequency', event.target.value)} /></LibraryField>
        <LibraryField label="Frequency unit *"><input className={inputClass} value={values.frequency_unit ?? ''} onChange={(event) => set('frequency_unit', event.target.value)} /></LibraryField>
        <LibraryField label="Confidence"><select className={selectClass} value={values.confidence_level ?? ''} onChange={(event) => set('confidence_level', event.target.value)}>{confidence.map((item) => <option key={item}>{item}</option>)}</select></LibraryField>
        <LibraryField label="Low estimate"><input type="number" step="any" min="0" className={inputClass} value={values.low_frequency ?? ''} onChange={(event) => set('low_frequency', event.target.value)} /></LibraryField>
        <LibraryField label="High estimate"><input type="number" step="any" min="0" className={inputClass} value={values.high_frequency ?? ''} onChange={(event) => set('high_frequency', event.target.value)} /></LibraryField>
        <LibraryField label="Scope"><select className={selectClass} value={values.scope ?? 'Corporate'} onChange={(event) => set('scope', event.target.value)}><option>Corporate</option><option>Site</option></select></LibraryField>
        <LibraryField label="Source type *"><select className={selectClass} value={values.source_type ?? ''} onChange={(event) => set('source_type', event.target.value)}>{sourceTypes.map((item) => <option key={item}>{item}</option>)}</select></LibraryField>
        <LibraryField label="Source reference *"><input className={inputClass} value={values.source_reference ?? ''} onChange={(event) => set('source_reference', event.target.value)} /></LibraryField>
        <LibraryField label="Standard / document reference"><input className={inputClass} value={values.standard_reference ?? ''} onChange={(event) => set('standard_reference', event.target.value)} /></LibraryField>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LibraryField label="Description"><textarea className={inputClass} rows={3} value={values.description ?? ''} onChange={(event) => set('description', event.target.value)} /></LibraryField>
        <LibraryField label="Service / application"><textarea className={inputClass} rows={3} value={values.service_application ?? ''} onChange={(event) => set('service_application', event.target.value)} /></LibraryField>
        <LibraryField label="Applicability notes"><textarea className={inputClass} rows={3} value={values.applicability_notes ?? ''} onChange={(event) => set('applicability_notes', event.target.value)} /></LibraryField>
        <LibraryField label="Exclusion notes"><textarea className={inputClass} rows={3} value={values.exclusion_notes ?? ''} onChange={(event) => set('exclusion_notes', event.target.value)} /></LibraryField>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <label className="flex items-center gap-2 rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-200"><input type="checkbox" checked={Boolean(values.site_modifier_allowed)} onChange={(event) => set('site_modifier_allowed', event.target.checked)} /> Site modifier allowed</label>
        <LibraryField label="Default site modifier"><input type="number" step="any" min="0" className={inputClass} value={values.default_site_modifier ?? '1'} onChange={(event) => set('default_site_modifier', event.target.value)} /></LibraryField>
        <label className="flex items-center gap-2 rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-200"><input type="checkbox" checked={Boolean(values.engineering_justification_required)} onChange={(event) => set('engineering_justification_required', event.target.checked)} /> Justification required</label>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LibraryField label="Engineering justification"><textarea className={inputClass} rows={3} value={values.engineering_justification ?? ''} onChange={(event) => set('engineering_justification', event.target.value)} /></LibraryField>
        <LibraryField label="Revision notes"><textarea className={inputClass} rows={3} value={values.revision_notes ?? ''} onChange={(event) => set('revision_notes', event.target.value)} /></LibraryField>
      </div>
      {error ? <div className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{String((error as any)?.response?.data?.message ?? (error as any)?.message ?? error)}</div> : null}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="lopa-button-secondary">Cancel</button>
        <button onClick={submit} disabled={isSaving} className="lopa-button-primary">{isSaving ? 'Saving...' : 'Save Event'}</button>
      </div>
    </LibraryDialog>
  );
}
