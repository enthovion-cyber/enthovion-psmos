import { TrainingCard, TrainingEmptyState } from '../shared/TrainingUi';

export function CertificateEvidencePanel({ documents }: { documents: Array<Record<string, unknown>> }) {
  return <TrainingCard title="Document Control Evidence" subtitle="Controlled evidence links preserve document IDs and status without storing file content in the certificate table.">{documents.length ? <ul className="space-y-2 text-sm">{documents.map((doc) => <li key={String(doc.id)} className="rounded-lg border border-[var(--psm-line)] p-3">{String(doc.document_type ?? 'Document')} - {String(doc.document_id ?? '')}<span className="ml-2 text-[var(--psm-muted)]">{String(doc.evidence_status ?? '')}</span></li>)}</ul> : <TrainingEmptyState title="No evidence linked" message="Link controlled certificate evidence from Document Control." />}</TrainingCard>;
}
