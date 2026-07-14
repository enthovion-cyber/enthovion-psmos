'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { allowedHazopAttachmentExtensions } from '../../schemas/hazop-attachment.schema';
import { attachmentCategories, linkedSections } from './HazopAttachmentFilters';

export function HazopUploadAttachmentDialog({ open, onClose, onUpload, saving }: { open: boolean; onClose: () => void; onUpload: (values: Record<string, any>) => void; saving?: boolean }) {
  const [form, setForm] = useState<Record<string, any>>({ category: 'Other', linkedSection: 'General', visibility: 'Study Team' });
  const [error, setError] = useState('');
  if (!open) return null;
  const file = form.file as File | undefined;
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const submit = () => {
    if (!file) return setError('File is required');
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!allowedHazopAttachmentExtensions.includes(ext)) return setError(`File type .${ext} is not allowed`);
    setError('');
    onUpload(form);
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="w-full max-w-4xl rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl"><div className="flex items-start justify-between border-b border-[var(--psm-line)] p-4"><div><h3 className="text-lg font-semibold">Upload HAZOP Attachment</h3><p className="text-sm text-[var(--psm-muted)]">Supporting evidence only. Controlled P&IDs/SOPs should be linked through Document Control.</p></div><button onClick={onClose}><X size={18} /></button></div><div className="grid gap-3 p-4 md:grid-cols-2"><label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">File</span><input className="input" type="file" onChange={(e) => set('file', e.target.files?.[0])} /></label><Field label="Category"><select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>{attachmentCategories.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Linked section"><select className="input" value={form.linkedSection} onChange={(e) => set('linkedSection', e.target.value)}>{linkedSections.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Visibility"><select className="input" value={form.visibility} onChange={(e) => set('visibility', e.target.value)}><option>Study Team</option><option>Restricted</option><option>Confidential</option><option>Public Internal</option></select></Field><Field label="Tags"><input className="input" value={form.tags ?? ''} onChange={(e) => set('tags', e.target.value)} placeholder="comma separated" /></Field><Field label="Linked node ID"><input className="input" onChange={(e) => set('linkedNodeId', e.target.value)} /></Field><Field label="Linked scenario ID"><input className="input" onChange={(e) => set('linkedScenarioId', e.target.value)} /></Field><Field label="Linked recommendation ID"><input className="input" onChange={(e) => set('linkedRecommendationId', e.target.value)} /></Field><Field label="Linked external record ID"><input className="input" onChange={(e) => set('linkedRecordId', e.target.value)} /></Field><label className="md:col-span-2"><span className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">Description / notes</span><textarea className="input min-h-24" onChange={(e) => set('description', e.target.value)} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(form.reviewRequired)} onChange={(e) => set('reviewRequired', e.target.checked)} /> Review required</label>{error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200 md:col-span-2">{error}</div> : null}</div><div className="flex justify-end gap-2 border-t border-[var(--psm-line)] p-4"><button onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold">Cancel</button><button disabled={saving} onClick={submit} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Uploading...' : 'Upload'}</button></div></div></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label><span className="mb-1 block text-xs font-semibold text-[var(--psm-muted)]">{label}</span>{children}</label>;
}
