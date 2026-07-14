import { ShieldCheck, UserRoundCheck } from 'lucide-react';
import type { RequiredRole } from '../../services/ptw-workforce.service';

export function KeyRolesPanel({ roles }: { roles: RequiredRole[] }) {
  return (
    <section className="psm-card p-5">
      <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"><ShieldCheck size={16} /> Key Roles</h3><span className="text-xs text-[var(--psm-muted)]">{roles.filter((role) => role.filled).length}/{roles.length} filled</span></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => <div key={role.role} className={`rounded-xl border p-4 ${role.filled ? 'border-success/25 bg-success/5' : 'border-warning/30 bg-warning/10'}`}>
          <div className="flex items-center justify-between gap-3"><div className="font-semibold">{role.role}</div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${role.filled ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>{role.filled ? 'Filled' : 'Missing'}</span></div>
          <div className="mt-2 space-y-1 text-xs text-[var(--psm-muted)]">{role.workers.length ? role.workers.map((worker) => <div key={worker.id} className="flex items-center gap-1"><UserRoundCheck size={12} /> {worker.worker_name}</div>) : <div>No assigned worker</div>}</div>
        </div>)}
      </div>
    </section>
  );
}
