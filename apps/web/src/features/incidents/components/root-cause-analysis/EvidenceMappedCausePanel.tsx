import { EvidenceSupportBadge } from '../shared/EvidenceSupportBadge';
import { RcaEmpty, RcaPanel } from './RcaPrimitives';

export function EvidenceMappedCausePanel({ rows }: { rows?: any[] }) {
  return <RcaPanel title="Evidence-Mapped Cause Panel" subtitle="Cause claims must be traceable to evidence records.">{!rows?.length ? <RcaEmpty text="No cause/evidence mappings available." /> : <div className="grid gap-2">{rows.map((row) => <div key={`${row.recordType}-${row.id}`} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-cyan-300/10"><div className="flex justify-between gap-2"><b>{row.recordType}: {row.title ?? row.root_cause_statement}</b><EvidenceSupportBadge value={row.supportLevel} /></div><p className={row.missingEvidence ? 'text-red-600 dark:text-red-200' : 'text-slate-500'}>{row.missingEvidence ? 'Missing evidence mapping' : `${row.evidence?.length ?? 0} evidence item(s) mapped`}</p></div>)}</div>}</RcaPanel>;
}
