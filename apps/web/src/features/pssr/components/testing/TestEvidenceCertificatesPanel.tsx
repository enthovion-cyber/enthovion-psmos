'use client';

import { EmptyState, PSSRCard } from '../pssr-ui';

export function TestEvidenceCertificatesPanel({ evidence }: { evidence: any[] }) {
  return <PSSRCard title="Test Evidence & Certificates">{evidence.length ? <div className="grid gap-2 md:grid-cols-2">{evidence.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><p className="font-bold text-white">{item.file_name ?? item.evidence_type}</p><p className="text-xs text-slate-500">{item.evidence_type} · {item.uploaded_at}</p><p className="mt-1 text-sm text-slate-400">{item.note}</p></div>)}</div> : <EmptyState title="No test evidence or certificates uploaded" />}</PSSRCard>;
}
