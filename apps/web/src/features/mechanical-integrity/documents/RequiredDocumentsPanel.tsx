import { SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';

export function RequiredDocumentsPanel({ rows }: { rows?: Array<Record<string, any>> }) {
  return <SectionCard title="Required Documents Panel" description="Backend-configured document requirements and latest evaluations.">{rows?.length ? <div className="space-y-2">{rows.slice(0, 8).map((row) => <div key={String(row.id)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm"><strong>{cardValue(row.document_type)}</strong><p className="text-xs text-[var(--psm-muted)]">{cardValue(row.requirement_name ?? row.missing_reason ?? row.status)}</p></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No requirement evaluations for this scope yet.</p>}</SectionCard>;
}
