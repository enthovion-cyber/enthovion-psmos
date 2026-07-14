'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { HazopLinkedRecordContext } from '../../types/hazop-linked-record.types';

export function AddLinkedRecordDialog({ open, context, onClose, onSave, isSaving }: { open: boolean; context?: HazopLinkedRecordContext; onClose: () => void; onSave: (values: Record<string, any>) => void; isSaving?: boolean }) {
  const [form, setForm] = useState<Record<string, any>>({ linkedModule: 'MOC', relationshipType: 'Related', dependencyDirection: 'Reference only', blockingRule: 'Not blocking' });
  useEffect(() => { if (open) setForm({ linkedModule: context?.modules?.[0] ?? 'MOC', relationshipType: 'Related', dependencyDirection: 'Reference only', blockingRule: 'Not blocking' }); }, [open, context?.modules]);
  if (!open) return null;
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--psm-line)] p-4"><div><h3 className="text-lg font-semibold">Add Linked Record</h3><p className="text-sm text-[var(--psm-muted)]">Create a governed HAZOP dependency link with blocker rules.</p></div><button onClick={onClose}><X size={18} /></button></div>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <Field label="Module / record type"><select className="input" value={form.linkedModule} onChange={(e) => set('linkedModule', e.target.value)}>{(context?.modules ?? ['MOC', 'PSSR', 'PTW', 'Equipment', 'Document']).map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Record ID"><input className="input" value={form.linkedRecordId ?? ''} onChange={(e) => set('linkedRecordId', e.target.value)} placeholder="Paste or select record id" /></Field>
          <Field label="Record number"><input className="input" value={form.linkedRecordNumber ?? ''} onChange={(e) => set('linkedRecordNumber', e.target.value)} /></Field>
          <Field label="Record title"><input className="input" value={form.linkedRecordTitle ?? ''} onChange={(e) => set('linkedRecordTitle', e.target.value)} /></Field>
          <Field label="Relationship type"><select className="input" value={form.relationshipType} onChange={(e) => set('relationshipType', e.target.value)}>{(context?.relationshipTypes ?? ['Related']).map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Dependency direction"><select className="input" value={form.dependencyDirection} onChange={(e) => set('dependencyDirection', e.target.value)}>{(context?.dependencyDirections ?? ['Reference only']).map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Blocking rule"><select className="input" value={form.blockingRule} onChange={(e) => set('blockingRule', e.target.value)}>{(context?.blockingRules ?? ['Not blocking']).map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Link reason"><input className="input" value={form.linkReason ?? ''} onChange={(e) => set('linkReason', e.target.value)} /></Field>
          <label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">Notes</span><textarea className="input min-h-24" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></label>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--psm-line)] p-4"><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={isSaving || !form.linkedRecordId} onClick={() => onSave(form)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Link'}</button></div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label><span className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">{label}</span>{children}</label>;
}
