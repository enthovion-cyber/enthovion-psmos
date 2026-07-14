'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function PunchEvidenceVerificationPanel({ evidence, verifications }: { evidence: any[]; verifications: any[] }) {
  return <PSSRCard title="Evidence / Verification Panel"><div className="grid gap-3 lg:grid-cols-2"><div>{evidence.length ? evidence.map((item) => <div key={item.id} className="mb-2 rounded-lg border border-white/10 bg-slate-950/30 p-3"><p className="font-bold text-white">{item.file_name ?? item.evidence_type}</p><p className="text-xs text-slate-500">{item.uploaded_at}</p></div>) : <EmptyState title="No evidence" />}</div><div>{verifications.length ? verifications.map((item) => <div key={item.id} className="mb-2 rounded-lg border border-white/10 bg-slate-950/30 p-3"><div className="flex justify-between"><p className="font-bold text-white">{item.status}</p><Badge tone={item.status === 'Verified' ? 'green' : 'red'}>{item.status}</Badge></div><p className="text-xs text-slate-500">{item.comment ?? item.rejection_reason}</p></div>) : <EmptyState title="No verifications" />}</div></div></PSSRCard>;
}
