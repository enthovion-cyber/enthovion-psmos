'use client';

import { useState } from 'react';
import type { DocumentUploadInput } from '@/services/documents.service';

const types = ['P&ID', 'SOP', 'Datasheet', 'Vendor Manual', 'Certificate', 'Drawing', 'Design Basis Document', 'HAZOP Report', 'PHA Report', 'Permit Form', 'Inspection Report', 'Startup Certificate', 'MOC Package', 'SDS', 'Other'];

export function DocumentUpload({ onUpload }: { onUpload: (input: DocumentUploadInput) => void }) {
  const [form, setForm] = useState({ title: '', description: '', documentType: 'P&ID', siteId: 'site_jubail', ownerId: 'user_imran_shah', tags: '', relatedEquipmentId: '', reviewFrequencyMonths: 12, changeSummary: 'Initial upload' });
  const [file, setFile] = useState<File | null>(null);
  return (
    <form onSubmit={(event) => { event.preventDefault(); if (file) onUpload({ ...form, file }); }} className="psm-card p-5">
      <h2 className="text-lg font-semibold">Upload Controlled Document</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Field label="Title" required value={form.title} onChange={(title) => setForm({ ...form, title })} />
        <label className="text-sm"><span className="mb-1.5 block text-[var(--psm-muted)]">Document Type *</span><select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} className="psm-input h-10 w-full px-3">{types.map((type) => <option key={type}>{type}</option>)}</select></label>
        <Field label="Site ID" required value={form.siteId} onChange={(siteId) => setForm({ ...form, siteId })} />
        <Field label="Owner ID" required value={form.ownerId} onChange={(ownerId) => setForm({ ...form, ownerId })} />
        <Field label="Tags" value={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
        <Field label="Related Equipment ID" value={form.relatedEquipmentId} onChange={(relatedEquipmentId) => setForm({ ...form, relatedEquipmentId })} />
        <Field label="Review Frequency Months" type="number" value={String(form.reviewFrequencyMonths)} onChange={(value) => setForm({ ...form, reviewFrequencyMonths: Number(value) })} />
        <Field label="Change Summary" value={form.changeSummary} onChange={(changeSummary) => setForm({ ...form, changeSummary })} />
      </div>
      <label className="mt-3 block text-sm"><span className="mb-1.5 block text-[var(--psm-muted)]">Description</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="psm-input min-h-20 w-full p-3" /></label>
      <input required type="file" className="mt-4 block text-sm" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      <button className="psm-button psm-button-primary mt-4 w-full">Upload Document</button>
    </form>
  );
}

function Field({ label, value, onChange, required, type = 'text' }: { label: string; value: string; type?: string; required?: boolean; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1.5 block text-[var(--psm-muted)]">{label}{required ? ' *' : ''}</span><input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="psm-input h-10 w-full px-3" /></label>;
}
