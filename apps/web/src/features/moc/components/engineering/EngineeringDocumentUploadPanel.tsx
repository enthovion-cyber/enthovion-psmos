'use client';

import { UploadCloud, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { Field, detailInput, detailTextarea, DetailCard } from '../moc-detail-ui';
import type { EngineeringDocumentValues } from '../../schemas/moc-engineering.schema';

const defaultValues: EngineeringDocumentValues = { documentType: 'P&ID redline / markup', title: '', description: '', controlledDocument: false, status: 'Uploaded', isRequired: false, requiredBeforeApproval: false, requiredBeforeStartup: false, requiredBeforeClosure: true };

export function EngineeringDocumentUploadPanel({ documentTypes, onUpload, onLink, saving, readOnly }: { documentTypes: string[]; onUpload: (values: EngineeringDocumentValues & { file?: File }) => void; onLink: (values: EngineeringDocumentValues) => void; saving?: boolean; readOnly?: boolean }) {
  const [values, setValues] = useState<EngineeringDocumentValues>(defaultValues);
  const [file, setFile] = useState<File | undefined>();
  const update = (patch: Partial<EngineeringDocumentValues>) => setValues((current) => ({ ...current, ...patch }));
  return (
    <DetailCard title="Document Upload / Link Panel">
      <div className="grid gap-3 lg:grid-cols-3">
        <Field label="Document Type *"><select className={detailInput} value={values.documentType} onChange={(e) => update({ documentType: e.target.value })}>{documentTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
        <Field label="Document Title *"><input className={detailInput} value={values.title} onChange={(e) => update({ title: e.target.value })} /></Field>
        <Field label="File"><input disabled={readOnly} className={detailInput} type="file" onChange={(e) => setFile(e.target.files?.[0])} /></Field>
        <Field label="Document Control Record"><input className={detailInput} value={values.documentId ?? ''} onChange={(e) => update({ documentId: e.target.value, controlledDocument: Boolean(e.target.value) })} /></Field>
        <Field label="Version"><input className={detailInput} value={values.version ?? ''} onChange={(e) => update({ version: e.target.value })} /></Field>
        <Field label="Review Due Date"><input className={detailInput} type="date" value={values.reviewDueDate ?? ''} onChange={(e) => update({ reviewDueDate: e.target.value })} /></Field>
        <div className="lg:col-span-3"><Field label="Description / Justification"><textarea className={detailTextarea} value={values.description ?? ''} onChange={(e) => update({ description: e.target.value })} /></Field></div>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-4">
        {(['isRequired', 'requiredBeforeApproval', 'requiredBeforeStartup', 'requiredBeforeClosure'] as const).map((key) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(values[key])} onChange={(e) => update({ [key]: e.target.checked } as any)} /> {label(key)}</label>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={readOnly || saving || !values.title} onClick={() => onUpload({ ...values, file })} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50"><UploadCloud className="h-4 w-4" /> Upload New Document</button>
        <button type="button" disabled={readOnly || saving || !values.documentId || !values.title} onClick={() => onLink(values)} className="inline-flex items-center gap-2 rounded-md border border-cyan-300/20 px-3 py-2 text-xs font-black text-cyan-100 disabled:opacity-50"><LinkIcon className="h-4 w-4" /> Link Document Control</button>
      </div>
    </DetailCard>
  );
}

function label(key: string) {
  return key === 'isRequired' ? 'Required' : key === 'requiredBeforeApproval' ? 'Before approval' : key === 'requiredBeforeStartup' ? 'Before startup' : 'Before closure';
}
