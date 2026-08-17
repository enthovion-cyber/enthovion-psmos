'use client';

import { useState } from 'react';
import { validateImpairmentRestoration } from '../schemas/impairment-restoration.schema';
import { PrimaryButton, SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { BoolField, Field, inputClass } from './sections/SectionField';

export function RestoreImpairmentForm({ saving, onSubmit }: { saving?: boolean; onSubmit: (input: Record<string, unknown>) => void }) {
  const [form, setForm] = useState<Record<string, any>>({ restoredAt: new Date().toISOString().slice(0, 16), returnedToNormal: true, controlRoomNotified: true, mitigationRemoved: true, sealLockRestored: true });
  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const missing = validateImpairmentRestoration(form);
  return (
    <SectionCard title="Restoration / Return to Normal" description="Capture restoration, functional testing, control-room notification, mitigation removal, seal/lock state, evidence, notes, and verification handoff.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Restored at"><input type="datetime-local" className={inputClass} value={form.restoredAt ?? ''} onChange={(e) => set('restoredAt', e.target.value)} /></Field>
        <Field label="Restoration method"><input className={inputClass} value={form.restorationMethod ?? ''} onChange={(e) => set('restorationMethod', e.target.value)} /></Field>
        <Field label="Functional test record ID"><input className={inputClass} value={form.functionalTestRecordId ?? ''} onChange={(e) => set('functionalTestRecordId', e.target.value)} /></Field>
        <Field label="Evidence ID"><input className={inputClass} value={form.restorationEvidenceId ?? ''} onChange={(e) => set('restorationEvidenceId', e.target.value)} /></Field>
        <Field label="Restoration notes"><textarea className={inputClass} rows={3} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {([
          ['returnedToNormal','Returned to normal'], ['functionalTestRequired','Functional test required'], ['functionalTestCompleted','Functional test completed'], ['controlRoomNotified','Control room notified'], ['mitigationRemoved','Mitigation removed'], ['sealLockRestored','Seal / lock restored']
        ] as Array<[string, string]>).map(([key, label]) => <BoolField key={key} label={label} checked={!!form[key]} onChange={(next) => set(key, next)} />)}
      </div>
      {missing.length ? <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{missing.join(' ')}</div> : null}
      <div className="mt-4"><PrimaryButton disabled={saving || missing.length > 0} title={missing.join(' ')} onClick={() => onSubmit(form)}>{saving ? 'Saving...' : 'Save Restoration'}</PrimaryButton></div>
    </SectionCard>
  );
}
