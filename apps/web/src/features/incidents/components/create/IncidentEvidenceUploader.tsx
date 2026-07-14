'use client';
import { useRef, useState } from 'react';
import { useIncidentEvidenceUpload } from '../../hooks/useIncidentEvidenceUpload';
import { Field, Select, StateBanner, TextArea, Toggle } from './FormBits';
const evidenceTypes = ['Photo','Video','Witness statement','DCS trend','Alarm log','Permit copy','Maintenance record','Inspection record','SDS','Lab report','CCTV reference','Emergency response log','Medical record restricted','Other'];
const classifications = ['Public','Internal','Confidential','Restricted','Medical Confidential'];
const allowedTypes = ['image/png','image/jpeg','image/webp','application/pdf','text/plain','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.wordprocessingml.document','video/mp4'];
const maxFileSize = 25 * 1024 * 1024;

export function IncidentEvidenceUploader({ values, update, canUpload, draftId, context }: { values: any; update: (p: any) => void; canUpload?: boolean; draftId?: string; context?: any }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const evidenceMutation = useIncidentEvidenceUpload();
  const [item, setItem] = useState<any>({ classification: 'Internal' });
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const evidence = Array.isArray(values.evidence) ? values.evidence : [];
  const permissionReason = !canUpload ? 'Missing incidents.evidence.upload permission' : undefined;

  const applyFile = (file: File) => {
    setUploadError(null);
    if (!allowedTypes.includes(file.type)) {
      setUploadError(`File type ${file.type || 'unknown'} is not allowed for initial evidence.`);
      return;
    }
    if (file.size > maxFileSize) {
      setUploadError('File is larger than the 25 MB wizard upload limit.');
      return;
    }
    const medical = item.evidenceType === 'Medical record restricted' || item.classification === 'Medical Confidential';
    setItem((current: any) => ({
      ...current,
      file,
      fileName: file.name,
      fileType: file.name.split('.').pop() ?? '',
      mimeType: file.type,
      fileSize: file.size,
      classification: medical ? 'Medical Confidential' : current.classification ?? 'Internal',
      restricted: medical ? true : !!current.restricted,
      medicalConfidential: medical
    }));
  };

  const onFiles = (files?: FileList | null) => {
    const file = files?.[0];
    if (file) applyFile(file);
  };

  const uploadOrAdd = () => {
    if (!item.fileName || !item.evidenceType) {
      setUploadError('Select a file and evidence type before adding evidence.');
      return;
    }
    const id = crypto.randomUUID();
    const storageKey = item.storageKey ?? `incident-evidence/${draftId ?? 'unsaved-draft'}/${id}-${item.fileName}`;
    const payload = {
      ...item,
      id,
      draftId,
      siteId: values.siteId,
      companyId: values.companyId,
      storageProvider: item.storageProvider ?? 'configured-storage',
      storageKey,
      uploadStatus: draftId ? 'Uploaded' : 'Pending Draft Save'
    };
    const localRow = { ...payload };
    delete localRow.file;
    setProgress(35);
    if (canUpload && draftId) {
      evidenceMutation.upload.mutate(localRow, {
        onSuccess: (row) => {
          setProgress(100);
          update({ evidence: [...evidence, { ...localRow, ...row, uploadStatus: 'Uploaded' }] });
          setItem({ classification: 'Internal' });
        },
        onError: (error: any) => {
          setProgress(0);
          setUploadError(error?.message ?? 'Evidence upload failed. You can retry or save the draft without losing entered evidence metadata.');
        }
      });
      return;
    }
    setProgress(100);
    update({ evidence: [...evidence, localRow] });
    setItem({ classification: 'Internal' });
  };

  const remove = (target: any) => {
    if (target.id && target.uploadStatus === 'Uploaded') {
      evidenceMutation.remove.mutate(target.id, { onError: (error: any) => setUploadError(error?.message ?? 'Could not remove uploaded evidence.') });
    }
    update({ evidence: evidence.filter((e: any) => (e.id ?? e.fileName) !== (target.id ?? target.fileName)) });
  };

  const retry = (target: any) => {
    setItem(target);
    setUploadError(null);
  };

  return <div className="space-y-3">
    {permissionReason ? <StateBanner tone="warn">{permissionReason}. You can still save draft metadata, but upload is disabled.</StateBanner> : null}
    {uploadError ? <StateBanner tone="error">{uploadError}</StateBanner> : null}
    <div
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); onFiles(event.dataTransfer.files); }}
      className={`rounded-xl border border-dashed p-5 text-center text-sm ${dragging ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-100' : 'border-slate-300 bg-slate-50 text-slate-600 dark:border-cyan-300/20 dark:bg-[#06111f] dark:text-slate-300'}`}
    >
      <input ref={inputRef} type="file" className="hidden" accept={allowedTypes.join(',')} onChange={(event) => onFiles(event.target.files)} />
      <div className="font-semibold">Drag and drop a photo/file, or choose one from your device</div>
      <div className="mt-1 text-xs opacity-80">Allowed: photos, PDF, text/CSV, Word, Excel, MP4. Max 25 MB. File content stays in configured storage; the incident database stores metadata only.</div>
      <button type="button" className="lopa-button-secondary mt-3" onClick={() => inputRef.current?.click()} disabled={!canUpload} title={permissionReason}>Choose File</button>
      {item.fileName ? <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-cyan-300/10 dark:bg-[#071525]">{item.fileName} - {Math.round((item.fileSize ?? 0) / 1024)} KB</div> : null}
      {progress > 0 ? <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} /></div> : null}
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      <Select label="Evidence type" required value={item.evidenceType} onChange={(v) => setItem({ ...item, evidenceType: v, restricted: v === 'Medical record restricted' ? true : item.restricted, medicalConfidential: v === 'Medical record restricted' ? true : item.medicalConfidential, classification: v === 'Medical record restricted' ? 'Medical Confidential' : item.classification })} options={evidenceTypes} />
      <Field label="Source" value={item.source} onChange={(v) => setItem({ ...item, source: v })} placeholder="Camera, witness, DCS, permit system..." />
      <Field label="Taken / collected by" value={item.collectedBy} onChange={(v) => setItem({ ...item, collectedBy: v })} />
      <Field label="Collected date/time" type="datetime-local" value={item.collectedAt} onChange={(v) => setItem({ ...item, collectedAt: v })} />
      <Select label="Classification" value={item.classification} onChange={(v) => setItem({ ...item, classification: v, restricted: v === 'Restricted' || v === 'Medical Confidential' ? true : item.restricted, medicalConfidential: v === 'Medical Confidential' })} options={classifications} />
      <Field label="File name / storage key" value={item.fileName} onChange={(v) => setItem({ ...item, fileName: v })} />
    </div>
    <TextArea label="Evidence description" value={item.description} onChange={(v) => setItem({ ...item, description: v })} />
    <div className="grid gap-2 md:grid-cols-3">
      <Toggle label="Restricted evidence" checked={!!item.restricted} onChange={(v) => setItem({ ...item, restricted: v })} />
      <Toggle label="Confidential evidence" checked={!!item.confidential} onChange={(v) => setItem({ ...item, confidential: v })} />
      <Toggle label="Medical/confidential protection" checked={!!item.medicalConfidential} disabled={!context?.permissions?.canManageMedical} reason="Missing incidents.medical_fields.manage permission" onChange={(v) => setItem({ ...item, medicalConfidential: v, restricted: v ? true : item.restricted, classification: v ? 'Medical Confidential' : item.classification })} />
    </div>
    <TextArea label="Notes" value={item.notes} onChange={(v) => setItem({ ...item, notes: v })} rows={2} />
    <button type="button" className="lopa-button-secondary" onClick={uploadOrAdd} disabled={evidenceMutation.upload.isPending} title={!draftId ? 'No draft ID yet. Evidence will be kept with the draft payload until you save draft or submit.' : undefined}>{evidenceMutation.upload.isPending ? 'Uploading...' : 'Upload / Add Evidence'}</button>
    <div className="grid gap-2">
      {evidence.length ? evidence.map((e: any) => <div key={e.id ?? e.fileName} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-cyan-300/10">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><b>{e.evidenceType}</b> - {e.fileName}<div className="text-xs text-slate-500 dark:text-slate-400">{e.description || 'No description'} | {e.classification ?? 'Unclassified'} | {e.uploadStatus ?? 'Pending Draft Save'}</div></div>
          <div className="flex gap-2"><button type="button" className="text-xs font-semibold text-blue-600 dark:text-blue-300" onClick={() => retry(e)}>Retry/Edit</button><button type="button" className="text-xs font-semibold text-red-600 dark:text-red-300" onClick={() => remove(e)}>Remove</button></div>
        </div>
      </div>) : <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-500 dark:border-cyan-300/10 dark:text-slate-400">No evidence added yet.</div>}
    </div>
  </div>;
}
