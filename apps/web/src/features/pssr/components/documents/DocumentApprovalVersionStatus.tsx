'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function DocumentApprovalVersionStatus({ readiness }: { readiness: any[] }) {
  return <PSSRCard title="Document Approval / Version Status">{readiness.length ? <div className="grid gap-2 md:grid-cols-2">{readiness.map((row) => <div key={row.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-black text-white">{row.document_title}</p><p className="text-xs text-slate-500">Required {row.required_version ?? '-'} · Current {row.current_version ?? '-'}</p></div><Badge tone={row.readiness_status === 'Ready' ? 'green' : row.readiness_status === 'Blocked' ? 'red' : 'amber'}>{row.readiness_status}</Badge></div></div>)}</div> : <EmptyState title="No version records" />}</PSSRCard>;
}
