'use client';

import { useState } from 'react';

export function HazopRiskUpdateDialog({ scenario, saving, onClose, onSave }: any) {
  const [form, setForm] = useState({ severity: scenario.severity ?? 3, likelihood: scenario.likelihood ?? 3, residualSeverity: scenario.residual_severity ?? '', residualLikelihood: scenario.residual_likelihood ?? '', comment: '' });
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => {
    const payload: Record<string, any> = { severity: Number(form.severity), likelihood: Number(form.likelihood), comment: form.comment };
    if (form.residualSeverity && form.residualLikelihood) {
      payload.residualSeverity = Number(form.residualSeverity);
      payload.residualLikelihood = Number(form.residualLikelihood);
    }
    onSave(payload);
  };
  return (
    <Dialog title={`Risk ranking - ${scenario.scenario_number}`} onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        <NumberSelect label="Severity" value={form.severity} onChange={(value) => set('severity', value)} />
        <NumberSelect label="Likelihood" value={form.likelihood} onChange={(value) => set('likelihood', value)} />
        <NumberSelect label="Residual Severity" optional value={form.residualSeverity} onChange={(value) => set('residualSeverity', value)} />
        <NumberSelect label="Residual Likelihood" optional value={form.residualLikelihood} onChange={(value) => set('residualLikelihood', value)} />
      </div>
      <label className="mt-4 block text-sm"><span className="mb-2 block text-[var(--psm-muted)]">Reason / change comment</span><textarea value={form.comment} onChange={(event) => set('comment', event.target.value)} className="input min-h-24" placeholder="Why is this risk ranking being changed?" /></label>
      <DialogActions saving={saving} onClose={onClose} onSave={save} saveLabel="Save Risk Ranking" />
    </Dialog>
  );
}

function NumberSelect({ label, value, optional, onChange }: { label: string; value: any; optional?: boolean; onChange: (value: any) => void }) {
  return <label className="text-sm"><span className="mb-2 block text-[var(--psm-muted)]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="input"><option value="">{optional ? 'Not set' : 'Select'}</option>{[1, 2, 3, 4, 5].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>;
}

function Dialog({ title, children, onClose }: { title: string; children: any; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold">{title}</h2><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm">Close</button></div>{children}</div></div>;
}

function DialogActions({ saving, onClose, onSave, saveLabel }: { saving: boolean; onClose: () => void; onSave: () => void; saveLabel: string }) {
  return <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={saving} onClick={onSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : saveLabel}</button></div>;
}
