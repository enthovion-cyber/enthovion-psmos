'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function PersonnelReadinessTable({ assignments, requirements, onComplete, onVerify }: { assignments: any[]; requirements: any[]; onComplete: (id: string) => void; onVerify: (id: string) => void }) {
  const requirement = (id: string) => requirements.find((item) => item.id === id);
  return (
    <PSSRCard title="Personnel Readiness Table">
      {assignments.length ? <div className="overflow-x-auto"><table className="min-w-[1080px] w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Worker / Role</th><th className="px-3 py-2">Required Training</th><th className="px-3 py-2">Completion</th><th className="px-3 py-2">Evidence</th><th className="px-3 py-2">Verification</th><th className="px-3 py-2">Due</th><th className="px-3 py-2">Actions</th></tr></thead><tbody>{assignments.map((item) => { const req = requirement(item.training_requirement_id); return <tr key={item.id} className="border-t border-white/5"><td className="px-3 py-3 font-bold text-white">{item.user_id ?? item.role_id ?? 'Assigned role'}<p className="text-xs font-normal text-slate-500">{item.employer_type}</p></td><td className="px-3 py-3 text-slate-300">{req?.title ?? '-'}</td><td className="px-3 py-3"><Badge tone={item.status === 'Verified' ? 'green' : item.status === 'Waived' ? 'amber' : 'blue'}>{item.status}</Badge></td><td className="px-3 py-3">{req?.evidence_required ? <Badge tone="amber">Required</Badge> : <Badge>Optional</Badge>}</td><td className="px-3 py-3">{req?.verification_required ? <Badge tone={item.verified_at ? 'green' : 'amber'}>{item.verified_at ? 'Verified' : 'Pending'}</Badge> : <Badge>Not Required</Badge>}</td><td className="px-3 py-3 text-slate-300">{req?.due_date ?? '-'}</td><td className="px-3 py-3"><div className="flex gap-2"><button onClick={() => onComplete(item.id)} className="rounded-md border border-emerald-300/20 px-2 py-1 text-xs font-bold text-emerald-200">Complete</button><button onClick={() => onVerify(item.id)} className="rounded-md border border-blue-300/20 px-2 py-1 text-xs font-bold text-blue-200">Verify</button></div></td></tr>; })}</tbody></table></div> : <EmptyState title="No personnel assignments" detail="Generate training requirements to create assignments and acknowledgement tracking." />}
    </PSSRCard>
  );
}
