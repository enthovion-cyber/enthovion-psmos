'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useMOCEquipmentSearch } from '../../hooks/useMOCContext';
import type { MOCCreateValues } from '../../schemas/moc.schema';
import type { MocContext } from '../../services/moc.service';
import { Field, inputClass, StepShell, textAreaClass } from './create-ui';

export function MOCAffectedLocationStep({ context }: { context?: MocContext }) {
  const [search, setSearch] = useState('');
  const equipmentQuery = useMOCEquipmentSearch(search);
  const { register, watch, setValue } = useFormContext<MOCCreateValues>();
  const selected = watch('equipmentIds') ?? [];
  return (
    <StepShell eyebrow="Step 2" title="Affected Location & Equipment">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid gap-4">
          <Field label="Process Unit"><select className={inputClass} {...register('unitId')}><option value="">Select unit</option>{context?.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></Field>
          <Field label="Area"><select className={inputClass} {...register('areaId')}><option value="">Select area</option>{context?.areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></Field>
          <Field label="Affected system / service"><input className={inputClass} {...register('affectedSystem')} /></Field>
          <Field label="Location description"><textarea className={textAreaClass} {...register('locationDescription')} /></Field>
        </div>
        <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Equipment Registry by tag or name" className={`${inputClass} pl-9`} />
          </div>
          <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {equipmentQuery.data?.map((item) => {
              const active = selected.includes(item.id);
              return (
                <button key={item.id} type="button" onClick={() => {
                  const next = active ? selected.filter((id) => id !== item.id) : [...selected, item.id];
                  setValue('equipmentIds', next, { shouldDirty: true });
                  if (!watch('primaryEquipmentId')) setValue('primaryEquipmentId', item.id);
                  if (item.unitId) setValue('unitId', item.unitId);
                  if (item.areaId) setValue('areaId', item.areaId);
                  if (item.system) setValue('affectedSystem', item.system);
                }} className={`w-full rounded-lg border p-3 text-left ${active ? 'border-blue-300/70 bg-blue-500/15' : 'border-white/10 bg-white/[0.03] hover:border-blue-300/40'}`}>
                  <div className="flex items-center justify-between gap-3"><strong className="text-white">{item.tag}</strong><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.safetyCritical || item.criticality === 'High' ? 'bg-red-500/15 text-red-200' : 'bg-emerald-500/15 text-emerald-200'}`}>{item.criticality ?? 'Normal'}</span></div>
                  <p className="mt-1 text-sm text-slate-300">{item.name} / {item.type}</p>
                  <p className="mt-2 text-xs text-slate-500">PTW {item.linkedPtwCount ?? 0} · Actions {item.openActionCount ?? 0} · Incidents {item.openIncidentCount ?? 0} · HAZOP {item.openHazopRecommendationCount ?? 0}</p>
                </button>
              );
            })}
            {search.length > 1 && !equipmentQuery.data?.length ? <p className="rounded-lg border border-dashed border-cyan-300/20 p-4 text-sm text-slate-400">No equipment found.</p> : null}
          </div>
        </div>
      </div>
    </StepShell>
  );
}
