'use client';

import type { UseFormReturn } from 'react-hook-form';
import Link from 'next/link';
import type { PSSRCreateValues } from '../../schemas/pssr-create.schema';
import { Badge, EmptyState, LoadingState, PSSRCard, riskTone, statusTone } from '../pssr-ui';

export function PSSRLinkedMOCStep({ form, mocContext, loading }: { form: UseFormReturn<PSSRCreateValues>; mocContext?: any; loading?: boolean }) {
  const moc = mocContext?.moc;
  return (
    <PSSRCard title="Linked MOC / Trigger Source">
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-400">Trigger Source</label>
          <select className="h-11 w-full rounded-md border border-cyan-300/15 bg-slate-950/45 px-3 text-sm text-white" {...form.register('triggerSource')}>{['MOC', 'Manual', 'Equipment', 'Project', 'Shutdown / Turnaround', 'Other'].map((item) => <option key={item}>{item}</option>)}</select>
          <input className="h-11 w-full rounded-md border border-cyan-300/15 bg-slate-950/45 px-3 text-sm text-white" placeholder="Linked MOC ID" {...form.register('mocId')} />
        </div>
        {loading ? <LoadingState /> : moc ? <div className="rounded-xl border border-blue-300/15 bg-blue-500/10 p-4">
          <div className="flex flex-wrap items-center gap-2"><Badge tone="blue">{moc.moc_number}</Badge><Badge tone={statusTone(moc.status)}>{moc.status}</Badge><Badge tone={riskTone(moc.risk_level)}>{moc.risk_level}</Badge></div>
          <h3 className="mt-3 text-xl font-black text-white">{moc.title}</h3>
          <p className="mt-2 text-sm text-slate-400">{moc.description}</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
            <span>Change type: {moc.change_type}</span><span>Startup blockers: {mocContext?.blockersPreview?.length ?? 0}</span>
            <span>Required startup actions: {(mocContext?.actions ?? []).filter((a: any) => a.required_before_startup).length}</span><span>Engineering readiness: tracked in MOC</span>
          </div>
          <Link className="mt-4 inline-flex rounded-md border border-blue-300/20 px-3 py-2 text-sm font-black text-blue-100" href={`/moc/${moc.id}`}>Open MOC Detail</Link>
        </div> : <EmptyState title="No linked MOC loaded" detail="Manual, equipment, project, shutdown, and commissioning PSSR records can continue without a linked MOC." />}
      </div>
    </PSSRCard>
  );
}
