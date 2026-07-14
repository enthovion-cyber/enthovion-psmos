'use client';

import { useState } from 'react';
import { HazopRiskSelect } from './HazopRiskBadge';

export function HazopRiskAcceptanceDialog({ scenario, saving, onClose, onSave }: any) {
  const [form, setForm] = useState({ acceptanceType: 'Temporary acceptance', justification: '', conditions: '', expiryDate: '', reviewDate: '', approverId: '' });
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => onSave(Object.fromEntries(Object.entries(form).filter(([, value]) => value !== '')));
  return (
    <Dialog title={`Risk acceptance - ${scenario.scenario_number}`} onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm"><span className="mb-2 block text-[var(--psm-muted)]">Acceptance type</span><HazopRiskSelect value={form.acceptanceType} values={['Temporary acceptance', 'Management acceptance', 'ALARP justification', 'No further action justified']} onChange={(value) => set('acceptanceType', value)} /></label>
        <label className="text-sm"><span className="mb-2 block text-[var(--psm-muted)]">Approver ID</span><input className="input" value={form.approverId} onChange={(event) => set('approverId', event.target.value)} placeholder="Optional approver user ID" /></label>
        <label className="text-sm"><span className="mb-2 block text-[var(--psm-muted)]">Expiry date</span><input type="date" className="input" value={form.expiryDate} onChange={(event) => set('expiryDate', event.target.value)} /></label>
        <label className="text-sm"><span className="mb-2 block text-[var(--psm-muted)]">Review date</span><input type="date" className="input" value={form.reviewDate} onChange={(event) => set('reviewDate', event.target.value)} /></label>
      </div>
      <label className="mt-4 block text-sm"><span className="mb-2 block text-[var(--psm-muted)]">Justification</span><textarea value={form.justification} onChange={(event) => set('justification', event.target.value)} className="input min-h-28" placeholder="Document why this risk is acceptable and how ALARP is demonstrated." /></label>
      <label className="mt-4 block text-sm"><span className="mb-2 block text-[var(--psm-muted)]">Conditions</span><textarea value={form.conditions} onChange={(event) => set('conditions', event.target.value)} className="input min-h-20" placeholder="Operating limits, compensating safeguards, review conditions..." /></label>
      <DialogActions saving={saving} onClose={onClose} onSave={save} saveLabel="Request Acceptance" />
    </Dialog>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: any; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">{title}</h2><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm">Close</button></div>{children}</div></div>;
}

function DialogActions({ saving, onClose, onSave, saveLabel }: { saving: boolean; onClose: () => void; onSave: () => void; saveLabel: string }) {
  return <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={saving} onClick={onSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : saveLabel}</button></div>;
}
