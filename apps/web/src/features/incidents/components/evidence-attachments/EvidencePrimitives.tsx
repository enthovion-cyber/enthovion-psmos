import type { ReactNode } from 'react';
import { Field, InfoRows, SelectField, TabPanel, TextArea, ToggleGrid, formatDate } from '../shared/IncidentTabPrimitives';
import { EvidenceClassificationBadge } from '../shared/EvidenceClassificationBadge';
import { EvidenceReviewStatusBadge } from '../shared/EvidenceReviewStatusBadge';
import { EvidenceTypeBadge } from '../shared/EvidenceTypeBadge';

export const evidenceTypes = ['Photo', 'Video', 'Document', 'Witness statement', 'DCS trend', 'Alarm log', 'CCTV reference', 'Emergency response log', 'Maintenance record', 'Inspection record', 'Medical record restricted', 'Other'];
export const classificationOptions = ['Public', 'Internal', 'Confidential', 'Restricted', 'Medical Confidential'];
export const evidenceStatuses = ['Draft', 'Active', 'Pending Review', 'Approved', 'Rejected', 'Superseded', 'Archived', 'Deleted'];

export function DrawerShell({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 p-3">
      <div className="ml-auto flex h-full max-w-2xl flex-col overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-cyan-300/10 dark:bg-[#071525]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-black">{title}</h2>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-cyan-300/10">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EvidenceForm({ form, set }: { form: any; set: (key: string, value: any) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <SelectField label="Evidence type" value={form.evidenceType} options={evidenceTypes} onChange={(value) => set('evidenceType', value)} />
      <SelectField label="Classification" value={form.classification} options={classificationOptions} onChange={(value) => set('classification', value)} />
      <Field label="File name" value={form.fileName} onChange={(value) => set('fileName', value)} />
      <Field label="File type / extension" value={form.fileType} onChange={(value) => set('fileType', value)} />
      <Field label="MIME type" value={form.mimeType} onChange={(value) => set('mimeType', value)} />
      <Field label="File size bytes" type="number" value={form.fileSize} onChange={(value) => set('fileSize', value)} />
      <Field label="Storage provider" value={form.storageProvider} onChange={(value) => set('storageProvider', value)} />
      <Field label="Storage key" value={form.storageKey} onChange={(value) => set('storageKey', value)} />
      <SelectField label="Status" value={form.status} options={evidenceStatuses} onChange={(value) => set('status', value)} />
      <SelectField label="Review status" value={form.reviewStatus} options={['Not Reviewed', 'Needs Review', 'Pending Review', 'Approved', 'Rejected']} onChange={(value) => set('reviewStatus', value)} />
      <Field label="Related tab" value={form.relatedTab} onChange={(value) => set('relatedTab', value)} />
      <Field label="Related record type" value={form.relatedRecordType} onChange={(value) => set('relatedRecordType', value)} />
      <Field label="Related record ID" value={form.relatedRecordId} onChange={(value) => set('relatedRecordId', value)} />
      <Field label="Source" value={form.source} onChange={(value) => set('source', value)} />
      <div className="md:col-span-2">
        <ToggleGrid form={form} set={set} keys={[['requiredEvidence', 'Required evidence'], ['restricted', 'Restricted'], ['confidential', 'Confidential'], ['medicalConfidential', 'Medical / confidential']]} />
      </div>
      <TextArea label="Description" value={form.description} onChange={(value) => set('description', value)} className="md:col-span-2" />
      <TextArea label="Notes / reason" value={form.notes ?? form.reason} onChange={(value) => set('notes', value)} className="md:col-span-2" />
    </div>
  );
}

export function EvidenceCards({ rows, empty }: { rows?: any[] | undefined; empty: string }) {
  if (!rows?.length) return <p className="text-xs text-slate-500">{empty}</p>;
  return (
    <div className="grid gap-2">
      {rows.map((row) => (
        <div key={row.id ?? row.title ?? row.file_name} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{row.file_name ?? row.title ?? row.document_title_snapshot ?? row.mapped_tab ?? row.event_type}</span>
            {row.evidence_type ? <EvidenceTypeBadge value={row.evidence_type} /> : null}
            {row.classification ? <EvidenceClassificationBadge value={row.classification} /> : null}
            {row.review_status ? <EvidenceReviewStatusBadge value={row.review_status} /> : null}
          </div>
          <p className="mt-1 text-slate-500">{row.description ?? row.mapping_reason ?? row.reason ?? row.notes ?? ''}</p>
          <div className="mt-1 text-[11px] text-slate-400">{formatDate(row.created_at ?? row.uploaded_at)}</div>
        </div>
      ))}
    </div>
  );
}

export function EvidenceInfoPanel({ title, rows, empty }: { title: string; rows?: any[] | undefined; empty: string }) {
  return <TabPanel title={title}><EvidenceCards rows={rows} empty={empty} /></TabPanel>;
}

export function ReviewBox({ review, onApprove, onReject }: any) {
  return (
    <div className="grid gap-3">
      <InfoRows rows={[['Status', review?.status], ['Requested at', formatDate(review?.requestedAt)], ['Decision', review?.decision], ['Decided at', formatDate(review?.decidedAt)], ['Reason', review?.reason]]} />
      <div className="flex gap-2">
        <button onClick={onApprove} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white">Approve</button>
        <button onClick={onReject} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-black text-red-600">Reject</button>
      </div>
    </div>
  );
}
