'use client';

import { Download, Eye, FileUp, Link2, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { PermitCreateValues } from '../schemas/permit.schema';
import { Field, Input, StepPanel } from './PermitWizardFields';

const attachmentTypes = [
  'Job Safety Analysis',
  'Method Statement',
  'Rescue Plan',
  'Excavation Drawing',
  'Radiography Plan',
  'Electrical Isolation Drawing',
  'P&ID',
  'SOP',
  'LOTO Photo',
  'Worksite Photo',
  'Other'
];

export function PermitAttachmentsStep() {
  const { control, register, setValue } = useFormContext<PermitCreateValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'attachments' });
  const attachments = useWatch<PermitCreateValues>({ name: 'attachments' }) ?? [];

  function addAttachment() {
    append({ id: crypto.randomUUID(), attachmentType: 'Job Safety Analysis', fileName: '', documentControlId: '' });
  }

  return (
    <StepPanel title="Step 8 - Attachments & Supporting Documents" subtitle="Upload file, Preview, Download, Delete before submit, and Link existing Document Control document.">
      <div className="mb-4 grid gap-3 rounded-lg border border-cyan-300/10 bg-black/10 p-4 text-sm text-slate-300 md:grid-cols-2">
        <div>Confined Space requires Rescue Plan attachment.</div>
        <div>Excavation requires Excavation Drawing if depth exceeds site threshold.</div>
        <div>Radiography requires Radiography Plan.</div>
        <div>High/Critical risk requires JSA or Method Statement.</div>
      </div>
      <div className="rounded-lg border border-cyan-300/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-300/10 p-3">
          <div className="text-sm font-bold text-white">Attachment types</div>
          <button type="button" className="ptw-toolbar-button" onClick={addAttachment}><Plus size={14} /> Add attachment</button>
        </div>
        <div className="grid gap-3 p-3">
          {fields.map((field, index) => {
            const file = attachments[index]?.file as File | undefined;
            const previewUrl = file ? URL.createObjectURL(file) : '';
            return (
              <div key={field.id} className="grid gap-3 rounded-lg border border-cyan-300/10 bg-black/10 p-3 lg:grid-cols-[220px_1fr_220px_160px]">
                <Field name={`attachments.${index}.attachmentType`} label="Attachment Type">
                  <select className="ptw-input w-full" {...register(`attachments.${index}.attachmentType`)}>
                    {attachmentTypes.map((type) => <option key={type}>{type}</option>)}
                  </select>
                </Field>
                <label className="block">
                  <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Upload file</span>
                  <input
                    type="file"
                    className="ptw-input w-full file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1 file:text-white"
                    onChange={(event) => {
                      const picked = event.target.files?.[0];
                      if (!picked) return;
                      setValue(`attachments.${index}.file`, picked, { shouldDirty: true, shouldValidate: true });
                      setValue(`attachments.${index}.fileName`, picked.name, { shouldDirty: true, shouldValidate: true });
                    }}
                  />
                  <input type="hidden" {...register(`attachments.${index}.fileName`)} />
                  <div className="mt-1 text-xs text-slate-400">{attachments[index]?.fileName || 'No file selected'}</div>
                </label>
                <Field name={`attachments.${index}.documentControlId`} label="Link existing Document Control document">
                  <Input name={`attachments.${index}.documentControlId` as any} />
                </Field>
                <div className="flex items-end gap-2">
                  {previewUrl ? <a className="ptw-toolbar-button h-10" href={previewUrl} target="_blank" rel="noreferrer"><Eye size={14} /> Preview</a> : <button type="button" disabled className="ptw-toolbar-button h-10 opacity-50"><Eye size={14} /> Preview</button>}
                  {previewUrl ? <a className="ptw-toolbar-button h-10" href={previewUrl} download={attachments[index]?.fileName}><Download size={14} /></a> : null}
                  <button type="button" className="ptw-toolbar-button h-10 text-red-200" onClick={() => remove(index)}><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
          {!fields.length ? (
            <div className="rounded-lg border border-dashed border-cyan-300/20 p-8 text-center text-sm text-slate-400">
              <FileUp className="mx-auto mb-2 h-8 w-8 text-blue-300" />
              No supporting documents added yet. Upload or link Job Safety Analysis, Method Statement, Rescue Plan, Excavation Drawing, Radiography Plan, Electrical Isolation Drawing, P&ID, SOP, LOTO Photo, Worksite Photo, or Other.
              <button type="button" className="ptw-toolbar-button mx-auto mt-4" onClick={addAttachment}><Link2 size={14} /> Add first attachment</button>
            </div>
          ) : null}
        </div>
      </div>
    </StepPanel>
  );
}
