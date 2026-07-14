'use client';

import { ShieldCheck } from 'lucide-react';
import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function ChecklistVerificationPanel({ verifications }: { verifications: any[] }) {
  return (
    <PSSRCard title="Verification Panel" action={<Badge tone="purple"><ShieldCheck size={13} /> Independent Verification</Badge>}>
      {verifications.length ? <div className="space-y-2">{verifications.slice(0, 6).map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><div className="flex items-center justify-between"><p className="font-black text-white">{item.status}</p><Badge tone={item.status === 'Verified' ? 'green' : item.status === 'Rejected' ? 'red' : 'amber'}>{item.status}</Badge></div><p className="mt-1 text-sm text-slate-400">{item.comment ?? item.rejection_reason ?? 'No comment'}</p><p className="mt-1 text-xs text-slate-500">{item.verified_at || item.rejected_at ? new Date(item.verified_at ?? item.rejected_at).toLocaleString() : '-'}</p></div>)}</div> : <EmptyState title="No verification records" detail="Request verification, verify, or reject checklist items from the checklist table." />}
    </PSSRCard>
  );
}
