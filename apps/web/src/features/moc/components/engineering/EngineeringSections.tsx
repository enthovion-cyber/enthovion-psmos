'use client';

import { Badge, DetailCard, EmptyState } from '../moc-detail-ui';

export function PIDRedlineSection({ documents, onUploadType }: { documents: any[]; onUploadType: (type: string) => void }) {
  return <Section title="P&ID Redline / Markup Section" type="P&ID redline / markup" documents={documents} onUploadType={onUploadType} text="Upload P&ID PDF, link controlled P&ID, open redline viewer placeholder, save redline as engineering evidence, track redline version, and trigger Document Control revision action." />;
}

export function EngineeringCalculationsSection({ documents, onUploadType }: { documents: any[]; onUploadType: (type: string) => void }) {
  return <Section title="Engineering Calculations Section" type="Engineering calculation" documents={documents} onUploadType={onUploadType} text="Supports relief sizing, hydraulic, heat/material balance, structural, electrical load, instrument sizing, process design, and other calculations with checker/reviewer status." />;
}

export function EquipmentDatasheetsSection({ documents, equipment, onUploadType }: { documents: any[]; equipment: any[]; onUploadType: (type: string) => void }) {
  return <DetailCard title="Equipment Datasheets Section"><div className="space-y-2">{equipment?.length ? equipment.map((item) => <div key={item.id ?? item.equipment_id} className="rounded-lg border border-white/10 bg-slate-950/35 p-3"><p className="font-black text-white">{item.equipment?.tag ?? item.equipment_id}</p><p className="text-xs text-slate-400">{item.equipment?.name ?? 'Affected equipment'} · Datasheet update status shown through linked engineering documents and Equipment Registry action.</p></div>) : <EmptyState title="No affected equipment linked" />}</div><Docs type="Equipment datasheet" documents={documents} onUploadType={onUploadType} /></DetailCard>;
}

export function VendorDocumentsSection({ documents, onUploadType }: { documents: any[]; onUploadType: (type: string) => void }) {
  return <Section title="Vendor Documents Section" type="Vendor document" documents={documents} onUploadType={onUploadType} text="Vendor manuals, drawings, data books, certificates, OEM recommendations, and supplier correspondence are controlled engineering evidence." />;
}

export function HazardousAreaClassificationSection({ documents, onUploadType, affected }: { documents: any[]; onUploadType: (type: string) => void; affected?: boolean }) {
  return <Section title="Hazardous Area Classification Section" type="Hazardous area classification drawing" documents={documents} onUploadType={onUploadType} text={`Hazardous area affected: ${affected ? 'Yes' : 'No'}. If affected, engineering/HSE review and evidence can block startup.`} />;
}

export function DesignBasisSection({ documents, onUploadType, riskLevel }: { documents: any[]; onUploadType: (type: string) => void; riskLevel?: string }) {
  return <Section title="Design Basis Section" type="Design basis document" documents={documents} onUploadType={onUploadType} text={`${['High', 'Critical'].includes(riskLevel ?? '') ? 'High/Critical risk requires a Design Basis Document or approved written justification.' : 'Design basis evidence is optional unless risk or policy requires it.'}`} />;
}

export function SISDCSSoftwareChangeSection({ documents, onUploadType, answers }: { documents: any[]; onUploadType: (type: string) => void; answers: any }) {
  const systems = ['SIS', 'DCS', 'BPCS', 'PLC', 'Fire & Gas', 'Alarm system', 'Historian', 'Other'];
  return <DetailCard title="SIS / DCS / Software Change Section"><p className="mb-3 text-sm text-slate-400">System affected: {answers?.sisAffected ? 'SIS' : answers?.safetySystemsAffected ? 'Safety / control system' : 'Not specified'}. Logic document, cause & effect, alarm/interlock list, cybersecurity review, backup/restore, test plan, and rollback plan are tracked here.</p><div className="mb-3 flex flex-wrap gap-2">{systems.map((item) => <Badge key={item} tone={(answers?.sisAffected && item === 'SIS') || (answers?.safetySystemsAffected && ['DCS', 'BPCS', 'PLC'].includes(item)) ? 'amber' : 'slate'}>{item}</Badge>)}</div><Docs type="SIS logic document" documents={documents} onUploadType={onUploadType} /><Docs type="DCS / BPCS logic document" documents={documents} onUploadType={onUploadType} /><Docs type="Cause & effect diagram" documents={documents} onUploadType={onUploadType} /></DetailCard>;
}

export function EngineeringReviewStatus({ pkg, reviews, onSubmit, onApprove, onReject, onRequestDocument, busy }: { pkg: any; reviews: any[]; onSubmit: () => void; onApprove: () => void; onReject: () => void; onRequestDocument: () => void; busy?: boolean }) {
  return (
    <DetailCard title="Engineering Review Status" action={<Badge tone={pkg?.status === 'Approved' ? 'green' : pkg?.readiness_status === 'Blocked' ? 'red' : 'amber'}>{pkg?.status ?? 'Not Started'}</Badge>}>
      <div className="grid gap-3 md:grid-cols-4">
        <Info label="Review owner" value={pkg?.reviewed_by ?? '-'} />
        <Info label="Approved by" value={pkg?.approved_by ?? '-'} />
        <Info label="Approved at" value={pkg?.approved_at ? new Date(pkg.approved_at).toLocaleString() : '-'} />
        <Info label="Returned reason" value={pkg?.rejection_reason ?? '-'} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onSubmit} disabled={busy} className="rounded-md border border-blue-300/20 px-3 py-2 text-xs font-black text-blue-200 disabled:opacity-50">Submit for Review</button>
        <button type="button" onClick={onApprove} disabled={busy} className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">Approve Package</button>
        <button type="button" onClick={onReject} disabled={busy} className="rounded-md border border-red-300/20 px-3 py-2 text-xs font-black text-red-200 disabled:opacity-50">Reject / Return</button>
        <button type="button" onClick={onRequestDocument} disabled={busy} className="rounded-md border border-amber-300/20 px-3 py-2 text-xs font-black text-amber-200 disabled:opacity-50">Request Missing Document</button>
      </div>
      <div className="mt-4 space-y-2">{reviews?.slice(0, 5).map((review) => <div key={review.id} className="rounded-lg border border-white/10 bg-slate-950/35 p-3 text-sm"><p className="font-bold text-white">{review.decision}</p><p className="text-xs text-slate-400">{review.comments ?? review.review_status} · {review.created_at ? new Date(review.created_at).toLocaleString() : '-'}</p></div>)}</div>
    </DetailCard>
  );
}

export function EngineeringDocumentPreviewDrawer({ document, preview, onClose }: { document: any; preview: any; onClose: () => void }) {
  if (!document) return null;
  return <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"><aside className="ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-cyan-300/10 bg-[#07182a] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase text-slate-500">Document Preview Drawer</p><h3 className="text-xl font-black text-white">{document.title}</h3></div><button type="button" onClick={onClose} className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200">Close</button></div><div className="rounded-xl border border-white/10 bg-slate-950/35 p-5"><p className="text-sm text-slate-300">Preview available: {preview?.previewAvailable ? 'Yes' : 'Metadata only'}</p><p className="mt-2 text-sm text-slate-400">File: {document.file_name ?? document.controlled_document_id ?? '-'}</p><p className="mt-2 text-sm text-slate-400">Storage key: {preview?.storageKey ?? document.file_key ?? document.storage_key ?? '-'}</p><p className="mt-4 text-xs leading-5 text-slate-500">Full browser markup/redline tool is represented by this drawer until the document viewer service is connected. No Adobe dependency is required.</p></div></aside></div>;
}

function Section({ title, type, documents, text, onUploadType }: { title: string; type: string; documents: any[]; text: string; onUploadType: (type: string) => void }) {
  return <DetailCard title={title}><p className="mb-3 text-sm text-slate-400">{text}</p><Docs type={type} documents={documents} onUploadType={onUploadType} /></DetailCard>;
}

function Docs({ type, documents, onUploadType }: { type: string; documents: any[]; onUploadType: (type: string) => void }) {
  const rows = documents.filter((doc) => doc.document_type === type);
  return <div className="space-y-2">{rows.length ? rows.map((doc) => <div key={doc.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/35 p-3"><div><p className="font-bold text-white">{doc.title}</p><p className="text-xs text-slate-500">{doc.status} · {doc.version ?? doc.version_label ?? 'No version'}</p></div><Badge tone={doc.status === 'Approved' ? 'green' : 'blue'}>{doc.status}</Badge></div>) : <button type="button" onClick={() => onUploadType(type)} className="w-full rounded-lg border border-dashed border-cyan-300/20 p-4 text-sm font-bold text-blue-200">Add {type}</button>}</div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-slate-950/35 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-white">{value}</p></div>;
}
