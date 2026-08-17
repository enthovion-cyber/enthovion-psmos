'use client';

import { useState } from 'react';
import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';

export function AddLinkedRecordDialog({ onClose, onSubmit, saving, defaults = {} }: { onClose: () => void; onSubmit: (input: Record<string, unknown>) => void; saving?: boolean; defaults?: Record<string, unknown> }) {
  const [form, setForm] = useState<Record<string, any>>({ sourceModule: 'Equipment', sourceRecordId: '', targetModule: 'MOC', targetRecordId: '', relationshipType: 'Related', relationshipDescription: '', readinessImpact: false, primaryLink: false, notes: '', ...defaults });
  const update = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const missing = !form.sourceModule ? 'Source module is required.' : !form.sourceRecordId ? 'Source record is required.' : !form.targetModule ? 'Target module is required.' : !form.targetRecordId ? 'Target record is required.' : !form.relationshipType ? 'Relationship type is required.' : '';
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <section className="w-full max-w-2xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-xl">
        <h2 className="text-lg font-bold">Add Linked Record</h2>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Search and access validation are enforced by the backend before the relationship is saved.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {['sourceModule','sourceRecordId','targetModule','targetRecordId','relationshipType'].map((key) => <label key={key} className="text-sm font-semibold">{key.replace(/([A-Z])/g, ' $1')}<input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form[key] ?? ''} onChange={(event) => update(key, event.target.value)} /></label>)}
          <label className="text-sm font-semibold md:col-span-2">Relationship description<textarea rows={3} className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={form.relationshipDescription ?? ''} onChange={(event) => update('relationshipDescription', event.target.value)} /></label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={!!form.readinessImpact} onChange={(event) => update('readinessImpact', event.target.checked)} /> Readiness impact</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={!!form.primaryLink} onChange={(event) => update('primaryLink', event.target.checked)} /> Primary link</label>
        </div>
        <div className="mt-5 flex justify-end gap-2"><ActionButton onClick={onClose}>Cancel</ActionButton><PrimaryButton disabled={saving || Boolean(missing)} title={missing} onClick={() => onSubmit(form)}>{saving ? 'Saving...' : 'Create Link'}</PrimaryButton></div>
      </section>
    </div>
  );
}
