'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { MOCCreateValues } from '../../schemas/moc.schema';
import { Field, inputClass, StepShell, textAreaClass } from './create-ui';

const docTypes = ['P&ID redline / markup', 'Engineering calculation attachments', 'Equipment datasheets', 'Vendor documents', 'Hazardous area classification drawings', 'Design basis document', 'Software logic document', 'SIS/DCS change document', 'Other supporting documents'];

export function MOCEngineeringPackageStep() {
  const { watch, setValue } = useFormContext<MOCCreateValues>();
  const docs = watch('engineeringDocuments') ?? [];
  const [draft, setDraft] = useState({ documentType: docTypes[0], title: '', fileName: '', justification: '' });
  return (
    <StepShell eyebrow="Step 7" title="Engineering Package">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
          <Field label="Document type"><select className={inputClass} value={draft.documentType} onChange={(event) => setDraft({ ...draft, documentType: event.target.value })}>{docTypes.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <div className="mt-3"><Field label="Title"><input className={inputClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></Field></div>
          <div className="mt-3"><Field label="File name / linked reference"><input className={inputClass} value={draft.fileName} onChange={(event) => setDraft({ ...draft, fileName: event.target.value })} /></Field></div>
          <div className="mt-3"><Field label="Justification"><textarea className={textAreaClass} value={draft.justification} onChange={(event) => setDraft({ ...draft, justification: event.target.value })} /></Field></div>
          <button type="button" onClick={() => draft.title && setValue('engineeringDocuments', [...docs, draft], { shouldDirty: true })} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow hover:opacity-90 transition-all"><Plus size={15} /> Add document</button>
        </div>
        <div className="space-y-2">
          {docs.map((doc, index) => (
            <div key={`${doc.title}-${index}`} className="flex items-start justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5">
              <div>
                <p className="font-bold text-[var(--psm-fg)]">{String(doc.title)}</p>
                <p className="text-xs text-[var(--psm-muted)]">{String(doc.documentType)} · {String(doc.fileName ?? 'Link pending')}</p>
              </div>
              <button type="button" onClick={() => setValue('engineeringDocuments', docs.filter((_, i) => i !== index), { shouldDirty: true })} className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all"><Trash2 size={14} /></button>
            </div>
          ))}
          {!docs.length ? (
            <p className="rounded-xl border border-dashed border-[var(--psm-line)] p-8 text-center text-sm text-[var(--psm-muted)]">Upload or link engineering documents. High/Critical risk requires a Design Basis Document or written justification. Safety system changes require SIS/DCS documentation.</p>
          ) : null}
        </div>
      </div>
    </StepShell>
  );
}
