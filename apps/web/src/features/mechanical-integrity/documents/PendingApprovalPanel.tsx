import { SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';
import type { MiDocumentLink } from '../types/mi-document.types';

export function PendingApprovalPanel({ rows }: { rows?: MiDocumentLink[] }) {
  const pending = (rows ?? []).filter((row) => /pending|draft/i.test(String(row.status ?? row.approval_status ?? '')));
  return <SectionCard title="Pending Approval Panel" description="Documents linked to MI that still require Document Control approval.">{pending.length ? <div className="space-y-2">{pending.slice(0, 8).map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><strong>{cardValue(row.document_title)}</strong><p className="text-xs text-[var(--psm-muted)]">{cardValue(row.status ?? row.approval_status)}</p></div>)}</div> : <p className="text-sm text-success">No linked documents are pending approval.</p>}</SectionCard>;
}
