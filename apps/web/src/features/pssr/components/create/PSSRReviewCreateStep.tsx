'use client';

import { Badge, PSSRCard, riskTone } from '../pssr-ui';

export function PSSRReviewCreateStep({ values, mocContext }: { values: any; mocContext?: any }) {
  return (
    <PSSRCard title="Review & Create">
      <div className="grid gap-4 lg:grid-cols-3">
        <Summary label="Title" value={values.title} />
        <Summary label="Type" value={values.pssrType} />
        <Summary label="Startup Type" value={values.startupType} />
        <Summary label="Target Startup" value={values.targetStartupAt} />
        <Summary label="Site / Unit / Area" value={[values.siteId, values.unitId, values.areaId].filter(Boolean).join(' / ')} />
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-xs uppercase text-slate-500">Risk</p><div className="mt-2"><Badge tone={riskTone(values.riskLevel)}>{values.riskLevel}</Badge></div></div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-blue-300/15 bg-blue-500/10 p-4"><p className="font-black text-white">Create actions</p><p className="mt-2 text-sm text-slate-300">Generate PSSR number, save linked MOC, affected equipment, checklist items, startup blockers, audit log, history event, notification, and search index.</p></div>
        <div className="rounded-lg border border-amber-300/15 bg-amber-500/10 p-4"><p className="font-black text-white">Linked MOC</p><p className="mt-2 text-sm text-slate-300">{mocContext?.moc ? `${mocContext.moc.moc_number} · ${mocContext.moc.title}` : 'No linked MOC selected.'}</p></div>
      </div>
    </PSSRCard>
  );
}

function Summary({ label, value }: { label: string; value?: any }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-1 font-bold text-white">{value || '-'}</p></div>;
}
