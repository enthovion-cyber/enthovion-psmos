'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function RequiredTrainingMatrix({ requirements }: { requirements: any[] }) {
  const groups = ['Operations', 'Control Room', 'Maintenance', 'Engineering', 'HSE', 'Contractors', 'Laboratory', 'Emergency Response', 'Inspection / Mechanical Integrity', 'Management', 'Other'];
  return (
    <PSSRCard title="Required Training Matrix">
      {requirements.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{groups.map((group) => {
        const rows = requirements.filter((item) => String(item.required_department_id ?? item.required_role_id ?? item.training_type ?? '').toLowerCase().includes(group.toLowerCase().split(' ')[0]));
        return <div key={group} className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><div className="mb-2 flex items-center justify-between"><p className="font-black text-white">{group}</p><Badge>{rows.length}</Badge></div>{rows.slice(0, 4).map((item) => <div key={item.id} className="border-t border-white/5 py-2"><p className="font-bold text-slate-200">{item.title}</p><p className="text-xs text-slate-500">{item.training_type} · {item.source}</p></div>)}</div>;
      })}</div> : <EmptyState title="No training requirements generated yet. Generate from linked MOC or add manually." />}
    </PSSRCard>
  );
}
