'use client';

import { Badge, PSSRCard } from '../pssr-ui';

export function RoleBasedReadinessPanel({ roles }: { roles: any[] }) {
  return <PSSRCard title="Role-Based Readiness"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{roles.map((role) => <div key={role.role} className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><div className="flex items-center justify-between"><p className="font-black text-white">{role.role}</p><Badge tone={role.startupBlocking ? 'red' : 'green'}>{role.startupBlocking ? 'Blocking' : 'Ready'}</Badge></div><p className="mt-2 text-sm text-slate-400">{role.completedCount}/{role.requiredCount} completed · {role.verifiedCount} verified · {role.pendingCount} pending</p></div>)}</div></PSSRCard>;
}
