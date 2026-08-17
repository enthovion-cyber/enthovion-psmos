import { TrainingCard } from '../../shared/TrainingUi';

export function WorkerAccountLinkSection({ value, onChange, context }: { value: Record<string, any>; onChange: (next: Record<string, any>) => void; context?: Record<string, any> }) {
  const users = Array.isArray(context?.users) ? context.users : [];
  const selected = users.find((user: any) => user.id === value.linkedUserId);
  return (
    <TrainingCard title="5. Account Link / Access" subtitle="Link to existing IAM users only. Role/access changes remain controlled by Admin/User Management.">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm"><span className="mb-1 block font-semibold">Linked user account</span><select className="w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" value={value.linkedUserId ?? ''} onChange={(e) => onChange({ linkedUserId: e.target.value })}><option value="">No linked user</option>{users.map((user: any) => <option key={user.id} value={user.id}>{user.displayName} - {user.email}</option>)}</select></label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(value.appAccessRequired)} onChange={(e) => onChange({ appAccessRequired: e.target.checked })} />App access required</label>
      </div>
      {selected ? <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm"><p className="font-semibold">{selected.displayName}</p><p className="text-[var(--psm-muted)]">{selected.email} · {selected.title ?? 'No title'} · {selected.status}</p></div> : null}
    </TrainingCard>
  );
}
