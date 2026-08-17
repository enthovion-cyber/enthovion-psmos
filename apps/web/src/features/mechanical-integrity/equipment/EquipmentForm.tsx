'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { EquipmentBasicInfoSection } from './EquipmentBasicInfoSection';
import { EquipmentLocationSection } from './EquipmentLocationSection';
import { EquipmentClassificationSection } from './EquipmentClassificationSection';
import { EquipmentTechnicalDataSection } from './EquipmentTechnicalDataSection';
import { EquipmentIntegritySection } from './EquipmentIntegritySection';
import { EquipmentScheduleDefaultsSection } from './EquipmentScheduleDefaultsSection';
import { EquipmentSafeguardRoleSection } from './EquipmentSafeguardRoleSection';
import { EquipmentLinkedRecordsSection } from './EquipmentLinkedRecordsSection';
import { EquipmentReviewCreateSection } from './EquipmentReviewCreateSection';

export type EquipmentFormState = Record<string, any> & {
  siteId: string;
  unitId: string;
  tag: string;
  name: string;
  type: string;
};

const initialState: EquipmentFormState = {
  siteId: '',
  unitId: '',
  areaId: '',
  tag: '',
  name: '',
  description: '',
  type: '',
  subtype: '',
  status: 'ACTIVE',
  criticality: 'MEDIUM',
  safetyCritical: false
};

export function EquipmentForm({ mode, initialValues, saving, onSubmit }: { mode: 'create' | 'edit'; initialValues?: Partial<EquipmentFormState>; saving?: boolean; onSubmit: (values: EquipmentFormState) => Promise<void> | void }) {
  const [values, setValues] = useState<EquipmentFormState>({ ...initialState, ...initialValues });
  const [attempted, setAttempted] = useState(false);
  const missing = useMemo(() => requiredMissing(values), [values]);
  const update = (patch: Partial<EquipmentFormState>) => setValues((current) => ({ ...current, ...patch }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (missing.length) return;
    await onSubmit(clean(values) as EquipmentFormState);
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      {attempted && missing.length ? <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">Missing required fields: {missing.join(', ')}</div> : null}
      <EquipmentBasicInfoSection values={values} onChange={update} />
      <EquipmentLocationSection values={values} onChange={update} />
      <EquipmentClassificationSection values={values} onChange={update} />
      <EquipmentTechnicalDataSection values={values} onChange={update} />
      <EquipmentIntegritySection values={values} onChange={update} />
      <EquipmentScheduleDefaultsSection values={values} onChange={update} />
      <EquipmentSafeguardRoleSection values={values} onChange={update} />
      <EquipmentLinkedRecordsSection values={values} onChange={update} />
      <EquipmentReviewCreateSection values={values} missing={missing} mode={mode} />
      <div className="sticky bottom-4 flex justify-end rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-lg">
        <button type="submit" disabled={saving} className="psm-button psm-button-primary" title={missing.length ? `Missing: ${missing.join(', ')}` : undefined}><Save size={16} /> {saving ? 'Saving...' : mode === 'create' ? 'Create Equipment' : 'Save Changes'}</button>
      </div>
    </form>
  );
}

function requiredMissing(values: EquipmentFormState) {
  return [
    !values.tag?.trim() ? 'Equipment tag' : null,
    !values.name?.trim() ? 'Equipment name' : null,
    !values.type?.trim() ? 'Equipment type' : null,
    !values.siteId?.trim() ? 'Site' : null,
    !values.unitId?.trim() ? 'Process unit' : null
  ].filter(Boolean) as string[];
}

function clean(values: EquipmentFormState) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value !== undefined));
}
