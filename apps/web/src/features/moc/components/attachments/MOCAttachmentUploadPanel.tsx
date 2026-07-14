'use client';

import { Upload } from 'lucide-react';
import { Field, detailInput, detailTextarea } from '../moc-detail-ui';

const sections = ['General', 'Change Details', 'Impact Assessment', 'Risk Ranking', 'Engineering Package', 'Closed-Loop Actions', 'Approval Workflow', 'Temporary / Emergency Control', 'PSSR / Startup Readiness', 'Communication & Training'];

export function MOCAttachmentUploadPanel({ draft, setDraft, file, setFile, onUpload, isUploading }: any) {
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-4 shadow-xl shadow-black/10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-wide text-white">Upload Panel</h2>
        <span className="text-xs text-slate-500">PDF, images, DOCX, XLSX, CSV, TXT</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Title"><input className={detailInput} value={draft.title ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, title: e.target.value }))} /></Field>
        <Field label="Attachment Type"><input className={detailInput} value={draft.attachmentType ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, attachmentType: e.target.value }))} placeholder="Field photo, vendor drawing, meeting notes..." /></Field>
        <Field label="Related Section">
          <select className={detailInput} value={draft.relatedSection ?? 'General'} onChange={(e) => setDraft((v: any) => ({ ...v, relatedSection: e.target.value }))}>
            {sections.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="File"><input className={detailInput} type="file" onChange={(e) => setFile(e.target.files?.[0])} /></Field>
        <Field label="Description"><textarea className={detailTextarea} value={draft.description ?? ''} onChange={(e) => setDraft((v: any) => ({ ...v, description: e.target.value }))} /></Field>
        <div className="flex items-end">
          <button disabled={isUploading || !file} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-black text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50" onClick={onUpload}>
            <Upload className="h-4 w-4" /> {isUploading ? 'Uploading...' : 'Upload Attachment'}
          </button>
        </div>
      </div>
    </section>
  );
}
