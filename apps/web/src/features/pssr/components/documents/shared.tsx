'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function DocSection({ title, rows, types, details }: { title: string; rows: any[]; types: string[]; details: string[] }) {
  const matches = rows.filter((row) => types.includes(row.document_title) || types.includes(row.document_type) || types.some((type) => String(row.document_title ?? '').toLowerCase().includes(type.toLowerCase())));
  return (
    <PSSRCard title={title}>
      <div className="mb-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{details.map((item) => <div key={item} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-300">{item}</div>)}</div>
      {matches.length ? <div className="space-y-2">{matches.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/30 p-3"><div><p className="font-black text-white">{row.document_title}</p><p className="text-xs text-slate-500">{row.document_number ?? 'No document number'} · {row.current_version ?? 'No version'}</p></div><Badge tone={row.readiness_status === 'Ready' ? 'green' : row.readiness_status === 'Blocked' ? 'red' : 'amber'}>{row.readiness_status}</Badge></div>)}</div> : <EmptyState title="No matching readiness records" detail="Generate document readiness requirements or link controlled documents." />}
    </PSSRCard>
  );
}
