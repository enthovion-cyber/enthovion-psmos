'use client';

import { Badge, DetailCard, EmptyState, MocButton } from '../moc-detail-ui';

export function PIDRedlineSection({ documents, onUploadType }: { documents: any[]; onUploadType: (type: string) => void }) {
  return <Section title="P&ID Redline / Markup Section" type="P&ID redline / markup" documents={documents} onUploadType={onUploadType} text="Upload P&ID PDF, link controlled P&ID, open redline viewer placeholder, save redline as engineering evidence, track redline version, and trigger Document Control revision action." />;
}

export function EngineeringCalculationsSection({ documents, onUploadType }: { documents: any[]; onUploadType: (type: string) => void }) {
  return <Section title="Engineering Calculations Section" type="Engineering calculation" documents={documents} onUploadType={onUploadType} text="Supports relief sizing, hydraulic, heat/material balance, structural, electrical load, instrument sizing, process design, and other calculations with checker/reviewer status." />;
}

export function EquipmentDatasheetsSection({ documents, equipment, onUploadType }: { documents: any[]; equipment: any[]; onUploadType: (type: string) => void }) {
  return (
    <DetailCard title="Equipment Datasheets Section">
      <div className="space-y-2">
        {equipment?.length ? (
          equipment.map((item) => (
            <div key={item.id ?? item.equipment_id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5">
              <p className="font-black text-[var(--psm-fg)]">{item.equipment?.tag ?? item.equipment_id}</p>
              <p className="text-xs text-[var(--psm-muted)]">{item.equipment?.name ?? 'Affected equipment'} · Datasheet update status shown through linked engineering documents and Equipment Registry action.</p>
            </div>
          ))
        ) : (
          <EmptyState title="No affected equipment linked" />
        )}
      </div>
      <div className="mt-4">
        <Docs type="Equipment datasheet" documents={documents} onUploadType={onUploadType} />
      </div>
    </DetailCard>
  );
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
  return (
    <DetailCard title="SIS / DCS / Software Change Section">
      <p className="mb-3 text-sm text-[var(--psm-muted)]">System affected: {answers?.sisAffected ? 'SIS' : answers?.safetySystemsAffected ? 'Safety / control system' : 'Not specified'}. Logic document, cause & effect, alarm/interlock list, cybersecurity review, backup/restore, test plan, and rollback plan are tracked here.</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {systems.map((item) => (
          <Badge key={item} tone={(answers?.sisAffected && item === 'SIS') || (answers?.safetySystemsAffected && ['DCS', 'BPCS', 'PLC'].includes(item)) ? 'amber' : 'slate'}>{item}</Badge>
        ))}
      </div>
      <div className="space-y-3">
        <Docs type="SIS logic document" documents={documents} onUploadType={onUploadType} />
        <Docs type="DCS / BPCS logic document" documents={documents} onUploadType={onUploadType} />
        <Docs type="Cause & effect diagram" documents={documents} onUploadType={onUploadType} />
      </div>
    </DetailCard>
  );
}

export function EngineeringReviewStatus({ pkg, reviews, onSubmit, onApprove, onReject, onRequestDocument, busy }: { pkg: any; reviews: any[]; onSubmit: () => void; onApprove: () => void; onReject: () => void; onRequestDocument: () => void; busy?: boolean }) {
  return (
    <DetailCard title="Engineering Review Status" action={<Badge tone={pkg?.status === 'Approved' ? 'green' : pkg?.readiness_status === 'Blocked' ? 'red' : 'amber'}>{pkg?.status ?? 'Not Started'}</Badge>}>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Info label="Review owner" value={pkg?.reviewed_by ?? '-'} />
        <Info label="Approved by" value={pkg?.approved_by ?? '-'} />
        <Info label="Approved at" value={pkg?.approved_at ? new Date(pkg.approved_at).toLocaleString() : '-'} />
        <Info label="Returned reason" value={pkg?.rejection_reason ?? '-'} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <MocButton variant="outline" onClick={onSubmit} disabled={busy}>Submit for Review</MocButton>
        <MocButton variant="primary" onClick={onApprove} disabled={busy}>Approve Package</MocButton>
        <MocButton variant="danger" onClick={onReject} disabled={busy}>Reject / Return</MocButton>
        <MocButton variant="outline" onClick={onRequestDocument} disabled={busy}>Request Missing Document</MocButton>
      </div>
      <div className="mt-4 space-y-2">
        {reviews?.slice(0, 5).map((review) => (
          <div key={review.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5 text-sm">
            <p className="font-bold text-[var(--psm-fg)]">{review.decision}</p>
            <p className="text-xs text-[var(--psm-muted)]">{review.comments ?? review.review_status} · {review.created_at ? new Date(review.created_at).toLocaleString() : '-'}</p>
          </div>
        ))}
      </div>
    </DetailCard>
  );
}

export function EngineeringDocumentPreviewDrawer({ document, preview, onClose }: { document: any; preview: any; onClose: () => void }) {
  if (!document) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 shadow-2xl text-[var(--psm-fg)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--psm-muted)]">Document Preview</p>
            <h3 className="text-xl font-black text-[var(--psm-fg)]">{document.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1.5 text-sm font-bold text-[var(--psm-fg)] hover:bg-[var(--psm-surface)]">Close</button>
        </div>
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-5">
          <p className="text-sm text-[var(--psm-fg)]">Preview available: <span className="font-bold">{preview?.previewAvailable ? 'Yes' : 'Metadata only'}</span></p>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">File: <span className="font-semibold text-[var(--psm-fg)]">{document.file_name ?? document.controlled_document_id ?? '-'}</span></p>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">Storage key: <span className="font-mono text-xs text-[var(--psm-fg)]">{preview?.storageKey ?? document.file_key ?? document.storage_key ?? '-'}</span></p>
          <p className="mt-4 text-xs leading-5 text-[var(--psm-muted)]">Full browser markup/redline tool is represented by this drawer until the document viewer service is connected. No Adobe dependency is required.</p>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, type, documents, text, onUploadType }: { title: string; type: string; documents: any[]; text: string; onUploadType: (type: string) => void }) {
  return (
    <DetailCard title={title}>
      <p className="mb-3 text-sm text-[var(--psm-muted)]">{text}</p>
      <Docs type={type} documents={documents} onUploadType={onUploadType} />
    </DetailCard>
  );
}

function Docs({ type, documents, onUploadType }: { type: string; documents: any[]; onUploadType: (type: string) => void }) {
  const rows = documents.filter((doc) => doc.document_type === type);
  return (
    <div className="space-y-2">
      {rows.length ? (
        rows.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5">
            <div>
              <p className="font-bold text-[var(--psm-fg)]">{doc.title}</p>
              <p className="text-xs text-[var(--psm-muted)]">{doc.status} · {doc.version ?? doc.version_label ?? 'No version'}</p>
            </div>
            <Badge tone={doc.status === 'Approved' ? 'green' : 'blue'}>{doc.status}</Badge>
          </div>
        ))
      ) : (
        <button type="button" onClick={() => onUploadType(type)} className="w-full rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface-2)]/50 p-4 text-sm font-bold text-primary hover:border-primary/50 transition-all">
          Add {type}
        </button>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--psm-muted)]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[var(--psm-fg)]">{value}</p>
    </div>
  );
}
