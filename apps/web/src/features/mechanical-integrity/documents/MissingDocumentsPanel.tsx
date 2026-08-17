import { SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';

export function MissingDocumentsPanel({ rows }: { rows?: Array<Record<string, any>> }) {
  return <SectionCard title="Missing Documents Panel" description="Required evidence not currently linked or accepted by waiver.">{rows?.length ? <div className="space-y-2">{rows.slice(0, 8).map((row) => <div key={String(row.id)} className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger"><strong>{cardValue(row.document_type)}</strong><p className="text-xs">{cardValue(row.missing_reason)}</p></div>)}</div> : <p className="text-sm text-success">No missing required documents in this scope.</p>}</SectionCard>;
}
