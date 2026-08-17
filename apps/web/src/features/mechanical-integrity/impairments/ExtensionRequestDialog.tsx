'use client';

import { useState } from 'react';
import { PrimaryButton, SectionCard } from '../safeguards/SafeguardUiPrimitives';
import { Field, inputClass } from './sections/SectionField';

export function ExtensionRequestDialog({ saving, onSubmit }: { saving?: boolean; onSubmit: (input: Record<string, unknown>) => void }) {
  const [form, setForm] = useState<Record<string, any>>({ extensionValue: 8, extensionUnit: 'Hours' });
  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <SectionCard title="Request Extension" description="Extension requests require reason, risk reassessment, mitigation update, and approver decision.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Extension value"><input type="number" className={inputClass} value={form.extensionValue ?? 8} onChange={(e) => set('extensionValue', Number(e.target.value))} /></Field>
        <Field label="Extension unit"><select className={inputClass} value={form.extensionUnit ?? 'Hours'} onChange={(e) => set('extensionUnit', e.target.value)}><option>Hours</option><option>Days</option><option>Weeks</option></select></Field>
        <Field label="Reason"><input className={inputClass} value={form.reason ?? ''} onChange={(e) => set('reason', e.target.value)} /></Field>
        <Field label="Additional mitigation"><input className={inputClass} value={form.additionalMitigation ?? ''} onChange={(e) => set('additionalMitigation', e.target.value)} /></Field>
      </div>
      <div className="mt-4"><PrimaryButton disabled={saving || !form.reason} title="Extension reason is required." onClick={() => onSubmit(form)}>{saving ? 'Saving...' : 'Submit Extension Request'}</PrimaryButton></div>
    </SectionCard>
  );
}
