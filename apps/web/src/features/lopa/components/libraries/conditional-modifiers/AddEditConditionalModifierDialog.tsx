'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ConditionalModifierLibraryRecord } from '../../../types/lopa-library.types';
import { inputClass, LibraryDialog, LibraryField, selectClass } from '../LibraryShared';

const modifierTypes = ['Time at risk / fraction of time exposed', 'Probability of ignition', 'Probability of personnel presence', 'Occupancy factor', 'Injury probability', 'Enabling condition factor', 'Probability of exposure', 'Probability of detection', 'Weather/wind direction factor', 'Demand/enabling state factor', 'Other'];
const sourceTypes = ['IEC 61508', 'IEC 61511', 'OREDA', 'CCPS Guidelines', 'Company historical data', 'Site-specific reliability data', 'Vendor data', 'Engineering judgement', 'Other approved source'];
const confidence = ['Low', 'Medium', 'High'];

const initial = {
  modifier_code: '',
  modifier_name: '',
  description: '',
  modifier_type: 'Time at risk / fraction of time exposed',
  application_context: '',
  default_value: '',
  low_value: '',
  high_value: '',
  unit: 'factor',
  confidence_level: 'Medium',
  source_type: 'Company historical data',
  source_reference: '',
  standard_reference: '',
  applicability_notes: '',
  exclusion_notes: '',
  scope: 'Corporate',
  override_allowed: false,
  engineering_justification_required: true,
  engineering_justification: '',
  revision_notes: '',
  active: true
};

export function AddEditConditionalModifierDialog({
  open,
  record,
  isSaving,
  error,
  onClose,
  onSave
}: {
  open: boolean;
  record?: ConditionalModifierLibraryRecord | null;
  isSaving?: boolean;
  error?: unknown;
  onClose: () => void;
  onSave: (values: Record<string, any>) => void;
}) {
  const defaults = useMemo(() => record ? { ...initial, ...record } : initial, [record]);
  const [values, setValues] = useState<Record<string, any>>(defaults);
  useEffect(() => setValues(defaults), [defaults, open]);
  const set = (key: string, value: any) => setValues((current) => ({ ...current, [key]: value }));
  const submit = () => onSave({
    ...values,
    default_value: Number(values.default_value),
    low_value: values.low_value === '' ? undefined : Number(values.low_value),
    high_value: values.high_value === '' ? undefined : Number(values.high_value)
  });
  return (
    <LibraryDialog open={open} onClose={onClose} title={record ? 'Edit Conditional Modifier' : 'Add Conditional Modifier'} subtitle="Modifier values are controlled library records with approved ranges, revision history, and study snapshot behavior.">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LibraryField label="Modifier code *"><input className={inputClass} value={values.modifier_code ?? ''} onChange={(event) => set('modifier_code', event.target.value)} /></LibraryField>
        <LibraryField label="Modifier name *"><input className={inputClass} value={values.modifier_name ?? ''} onChange={(event) => set('modifier_name', event.target.value)} /></LibraryField>
        <LibraryField label="Modifier type *"><select className={selectClass} value={values.modifier_type ?? ''} onChange={(event) => set('modifier_type', event.target.value)}>{modifierTypes.map((item) => <option key={item}>{item}</option>)}</select></LibraryField>
        <LibraryField label="Default value *"><input type="number" step="any" min="0" className={inputClass} value={values.default_value ?? ''} onChange={(event) => set('default_value', event.target.value)} /></LibraryField>
        <LibraryField label="Low approved value"><input type="number" step="any" min="0" className={inputClass} value={values.low_value ?? ''} onChange={(event) => set('low_value', event.target.value)} /></LibraryField>
        <LibraryField label="High approved value"><input type="number" step="any" min="0" className={inputClass} value={values.high_value ?? ''} onChange={(event) => set('high_value', event.target.value)} /></LibraryField>
        <LibraryField label="Unit"><input className={inputClass} value={values.unit ?? ''} onChange={(event) => set('unit', event.target.value)} /></LibraryField>
        <LibraryField label="Confidence"><select className={selectClass} value={values.confidence_level ?? ''} onChange={(event) => set('confidence_level', event.target.value)}>{confidence.map((item) => <option key={item}>{item}</option>)}</select></LibraryField>
        <LibraryField label="Scope"><select className={selectClass} value={values.scope ?? 'Corporate'} onChange={(event) => set('scope', event.target.value)}><option>Corporate</option><option>Site</option></select></LibraryField>
        <LibraryField label="Source type *"><select className={selectClass} value={values.source_type ?? ''} onChange={(event) => set('source_type', event.target.value)}>{sourceTypes.map((item) => <option key={item}>{item}</option>)}</select></LibraryField>
        <LibraryField label="Source reference *"><input className={inputClass} value={values.source_reference ?? ''} onChange={(event) => set('source_reference', event.target.value)} /></LibraryField>
        <LibraryField label="Standard / document reference"><input className={inputClass} value={values.standard_reference ?? ''} onChange={(event) => set('standard_reference', event.target.value)} /></LibraryField>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LibraryField label="Description"><textarea className={inputClass} rows={3} value={values.description ?? ''} onChange={(event) => set('description', event.target.value)} /></LibraryField>
        <LibraryField label="Application context"><textarea className={inputClass} rows={3} value={values.application_context ?? ''} onChange={(event) => set('application_context', event.target.value)} /></LibraryField>
        <LibraryField label="Applicability notes"><textarea className={inputClass} rows={3} value={values.applicability_notes ?? ''} onChange={(event) => set('applicability_notes', event.target.value)} /></LibraryField>
        <LibraryField label="Exclusion notes"><textarea className={inputClass} rows={3} value={values.exclusion_notes ?? ''} onChange={(event) => set('exclusion_notes', event.target.value)} /></LibraryField>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className="flex items-center gap-2 rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-200"><input type="checkbox" checked={Boolean(values.override_allowed)} onChange={(event) => set('override_allowed', event.target.checked)} /> Study override allowed by policy</label>
        <label className="flex items-center gap-2 rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-200"><input type="checkbox" checked={Boolean(values.engineering_justification_required)} onChange={(event) => set('engineering_justification_required', event.target.checked)} /> Justification required</label>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LibraryField label="Engineering justification"><textarea className={inputClass} rows={3} value={values.engineering_justification ?? ''} onChange={(event) => set('engineering_justification', event.target.value)} /></LibraryField>
        <LibraryField label="Revision notes"><textarea className={inputClass} rows={3} value={values.revision_notes ?? ''} onChange={(event) => set('revision_notes', event.target.value)} /></LibraryField>
      </div>
      {error ? <div className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{String((error as any)?.response?.data?.message ?? (error as any)?.message ?? error)}</div> : null}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="lopa-button-secondary">Cancel</button>
        <button onClick={submit} disabled={isSaving} className="lopa-button-primary">{isSaving ? 'Saving...' : 'Save Modifier'}</button>
      </div>
    </LibraryDialog>
  );
}
