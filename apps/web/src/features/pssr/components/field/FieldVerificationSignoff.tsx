'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function FieldVerificationSignoff({ signoffs }: { signoffs: any[]; onSign?: (role: string) => void }) {
  return <PSSRCard title="Field Verification Signoff">{signoffs.length ? <div className="space-y-2">{signoffs.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/30 p-3"><div><p className="font-black text-white">{item.signoff_role}</p><p className="text-xs text-slate-500">{item.signed_at ? new Date(item.signed_at).toLocaleString() : 'Pending signoff'}</p></div><div className="flex items-center gap-2"><Badge tone={item.status === 'Signed' ? 'green' : 'amber'}>{item.status}</Badge><span className="rounded-md border border-blue-300/20 px-3 py-2 text-xs font-black text-blue-100">Universal E-Signature</span></div></div>)}</div> : <EmptyState title="No signoff roles generated" detail="Generate field verification to create required signoff roles." />}</PSSRCard>;
}
