'use client';

import { Badge, DetailCard, EmptyState } from '../moc-detail-ui';

const areaLabels: Record<string, string> = {
  equipment: 'Equipment',
  chemistry: 'Chemistry',
  procedure: 'Procedure',
  operating_limits: 'Operating Limits',
  safety_systems: 'Safety Systems',
  training: 'Training',
  documents: 'Documents / PSI',
  environmental: 'Environmental',
  quality: 'Quality / Production'
};

export function GeneratedActionsPreview({ actions = [], blockers = { startup: [], closure: [] }, onRegenerate, onApply, regenerating, applying, locked }: { actions?: any[]; blockers?: { startup?: any[]; closure?: any[] }; onRegenerate?: () => void; onApply?: () => void; regenerating?: boolean; applying?: boolean; locked?: boolean }) {
  const grouped = actions.reduce<Record<string, any[]>>((acc, item) => {
    const key = item.impactArea ?? item.impact_area ?? 'other';
    acc[key] = [...(acc[key] ?? []), item];
    return acc;
  }, {});
  return (
    <DetailCard
      title="Generated Required Actions Preview"
      action={<div className="flex flex-wrap gap-2"><button disabled={locked || regenerating} type="button" onClick={onRegenerate} className="rounded-md border border-blue-300/30 px-3 py-2 text-xs font-black text-blue-100 disabled:opacity-50">{regenerating ? 'Regenerating...' : 'Regenerate Actions'}</button><button disabled={locked || applying || !actions.length} type="button" onClick={onApply} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">{applying ? 'Applying...' : 'Apply Generated Actions'}</button></div>}
    >
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <BlockerList title="Startup blockers" items={blockers.startup ?? []} />
        <BlockerList title="Closure blockers" items={blockers.closure ?? []} />
      </div>
      {!actions.length ? <EmptyState title="No generated actions yet" detail="Save or regenerate the impact assessment to calculate required actions." /> : null}
      <div className="space-y-4">
        {Object.entries(grouped).map(([area, items]) => (
          <section key={area} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black text-white">{areaLabels[area] ?? area}</h3>
              <Badge tone="blue">{items.length} actions</Badge>
            </div>
            <div className="grid gap-3">
              {items.map((item) => <ActionCard key={`${item.ruleId}-${item.title}`} item={item} />)}
            </div>
          </section>
        ))}
      </div>
    </DetailCard>
  );
}

function ActionCard({ item }: { item: any }) {
  const priorityTone = item.priority === 'SAFETY_CRITICAL' || item.priority === 'HIGH' ? 'red' : item.priority === 'MEDIUM' ? 'amber' : 'green';
  const statusTone = item.status === 'Completed' ? 'green' : item.status === 'No Longer Required' ? 'slate' : item.status === 'In Progress' ? 'amber' : 'blue';
  return (
    <article className="rounded-lg border border-cyan-300/10 bg-slate-950/35 p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="font-black text-white">{item.title}</h4>
          <p className="mt-1 text-sm text-slate-400">{item.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge tone={priorityTone as any}>{item.priority}</Badge>
          <Badge tone={statusTone as any}>{item.status}</Badge>
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-3 xl:grid-cols-6">
        <span>Source: {item.sourceImpactAnswer}</span>
        <span>Module: {item.linkedModule}</span>
        <span>Due: {item.dueDate}</span>
        <span>Approval: {item.requiredBeforeApproval ? 'Yes' : 'No'}</span>
        <span>Startup: {item.requiredBeforeStartup ? 'Yes' : 'No'}</span>
        <span>Closure: {item.requiredBeforeClosure ? 'Yes' : 'No'}</span>
        <span>Evidence: {item.evidenceRequired ? 'Required' : 'No'}</span>
        <span>Verification: {item.verificationRequired ? 'Required' : 'No'}</span>
      </div>
    </article>
  );
}

function BlockerList({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
      <div className="mb-2 flex items-center justify-between"><h4 className="text-sm font-black text-white">{title}</h4><Badge tone={items.length ? 'red' : 'green'}>{items.length}</Badge></div>
      {items.length ? <ul className="space-y-2">{items.slice(0, 4).map((item, index) => <li key={`${item.title}-${index}`} className="text-sm text-slate-300">{item.title} <span className="text-slate-500">({item.status})</span></li>)}</ul> : <p className="text-sm text-slate-500">No blockers.</p>}
    </div>
  );
}
