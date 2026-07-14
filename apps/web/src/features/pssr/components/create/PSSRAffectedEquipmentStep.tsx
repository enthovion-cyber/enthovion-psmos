'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { PSSRCreateValues } from '../../schemas/pssr-create.schema';
import { Badge, Field, inputClass, PSSRCard } from '../pssr-ui';

export function PSSRAffectedEquipmentStep({ form, context, mocContext }: { form: UseFormReturn<PSSRCreateValues>; context?: any; mocContext?: any }) {
  const equipment = mocContext?.equipment ?? [];
  return (
    <PSSRCard title="Affected Location & Equipment">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Primary Equipment"><select className={inputClass} {...form.register('primaryEquipmentId')}><option value="">Select primary equipment</option>{equipment.map((row: any) => <option key={row.equipment_id} value={row.equipment_id}>{row.equipment?.tag ?? row.equipment_tag_snapshot} · {row.equipment?.name}</option>)}</select></Field>
        <Field label="System / Service"><input className={inputClass} {...form.register('systemService')} placeholder="Feedwater system, SIS loop, utility service..." /></Field>
        <Field label="Location Description"><textarea className="min-h-24 w-full rounded-md border border-cyan-300/15 bg-slate-950/45 px-3 py-2 text-sm text-white" {...form.register('locationDescription')} /></Field>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="font-black text-white">MOC / Equipment Registry Snapshot</h3>
          <div className="mt-3 space-y-2">{equipment.length ? equipment.map((row: any) => <div key={row.equipment_id} className="rounded-lg border border-white/10 p-3"><div className="flex items-center justify-between"><p className="font-bold text-white">{row.equipment?.tag ?? row.equipment_tag_snapshot}</p><Badge tone={row.equipment?.criticality === 'High' ? 'red' : 'blue'}>{row.equipment?.criticality ?? 'Linked'}</Badge></div><p className="text-xs text-slate-400">{row.equipment?.name} · {row.equipment?.type}</p></div>) : <p className="text-sm text-slate-500">Search integration is available through the PSSR equipment API. Linked MOC equipment appears here when provided.</p>}</div>
        </div>
      </div>
    </PSSRCard>
  );
}
