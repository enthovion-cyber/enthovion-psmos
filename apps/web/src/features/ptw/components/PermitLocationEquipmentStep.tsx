'use client';

import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { Permit } from '@/services/ptw.service';
import type { PermitCreateValues } from '../schemas/permit.schema';
import { Field, Grid, Input, StepPanel, Textarea } from './PermitWizardFields';

type EquipmentLookup = {
  id: string;
  tag: string;
  name: string;
  type?: string;
  criticality?: string;
  safetyCritical?: boolean;
  unitId?: string;
  areaId?: string;
  unit?: { name?: string };
  area?: { name?: string };
};

export function PermitLocationEquipmentStep({ equipment, activePermits }: { equipment: EquipmentLookup[]; activePermits: Permit[] }) {
  const { setValue } = useFormContext<PermitCreateValues>();
  const equipmentTag = useWatch<PermitCreateValues>({ name: 'equipmentTag' });
  const riskLevel = useWatch<PermitCreateValues>({ name: 'riskLevel' });
  const selected = useMemo(() => equipment.find((item) => item.tag.toLowerCase() === String(equipmentTag ?? '').toLowerCase()), [equipment, equipmentTag]);
  const selectedPermits = selected ? activePermits.filter((permit) => permit.equipment_id === selected.id || permit.equipment_tag === selected.tag) : [];

  function applyEquipment(id: string) {
    const item = equipment.find((next) => next.id === id);
    if (!item) return;
    setValue('equipmentId', item.id, { shouldDirty: true });
    setValue('equipmentTag', item.tag, { shouldValidate: true, shouldDirty: true });
    setValue('equipmentName', item.name, { shouldDirty: true });
    setValue('equipmentType', item.type ?? '', { shouldDirty: true });
    setValue('unitId', item.unitId ?? '', { shouldDirty: true });
    setValue('processUnit', item.unit?.name ?? '', { shouldDirty: true });
    setValue('areaId', item.areaId ?? '', { shouldValidate: true, shouldDirty: true });
    setValue('area', item.area?.name ?? '', { shouldDirty: true });
    setValue('equipmentCriticality', item.criticality ?? '', { shouldDirty: true });
    if ((item.safetyCritical || item.criticality === 'HIGH') && riskLevel !== 'Critical') {
      setValue('riskLevel', 'High', { shouldDirty: true, shouldValidate: true });
    }
  }

  return (
    <StepPanel title="Step 2 - Work Location & Equipment" subtitle="Equipment Tag search queries the Equipment Registry API and selecting equipment auto-fills Equipment Name, Equipment Type, Unit, Area, and Criticality.">
      <Grid>
        <Field name="department" label="Department"><Input name="department" /></Field>
        <Field name="processUnit" label="Process Unit"><Input name="processUnit" /></Field>
        <Field name="areaId" label="Area" required><Input name="areaId" /></Field>
        <Field name="locationDescription" label="Work Location Description" required><Textarea name="locationDescription" /></Field>
        <Field name="gpsLatitude" label="GPS Latitude"><Input name="gpsLatitude" /></Field>
        <Field name="gpsLongitude" label="GPS Longitude"><Input name="gpsLongitude" /></Field>
        <Field name="equipmentTag" label="Equipment Tag" required>
          <input list="ptw-equipment-tags" className="ptw-input w-full" value={equipmentTag ?? ''} onChange={(event) => {
            setValue('equipmentTag', event.target.value, { shouldDirty: true, shouldValidate: true });
            const match = equipment.find((item) => item.tag.toLowerCase() === event.target.value.toLowerCase());
            if (match) applyEquipment(match.id);
          }} />
          <datalist id="ptw-equipment-tags">{equipment.map((item) => <option key={item.id} value={item.tag}>{item.name}</option>)}</datalist>
        </Field>
        <Field name="equipmentName" label="Equipment Name"><Input name="equipmentName" /></Field>
        <Field name="equipmentType" label="Equipment Type"><Input name="equipmentType" /></Field>
        <Field name="equipmentCriticality" label="Equipment Criticality"><Input name="equipmentCriticality" /></Field>
        <Field name="linkedEquipmentTags" label="Linked Equipment Tags"><Input name="linkedEquipmentTags" /></Field>
        <Field name="nearbyEquipment" label="Nearby Equipment"><Input name="nearbyEquipment" /></Field>
        <Field name="locationMapReference" label="Location Map Reference"><Input name="locationMapReference" /></Field>
      </Grid>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <InfoBox title="Existing active permits for selected equipment" empty="No active permits for selected equipment.">
          {selectedPermits.map((permit) => <div key={permit.id} className="text-sm text-slate-300">{permit.permit_number} - {permit.title}</div>)}
        </InfoBox>
        <InfoBox title="Open MOCs/actions for selected equipment if available" empty="Open MOCs/actions will appear from linked equipment records when available." />
      </div>
    </StepPanel>
  );
}

function InfoBox({ title, empty, children }: { title: string; empty: string; children?: React.ReactNode }) {
  return <div className="rounded-lg border border-cyan-300/10 bg-black/10 p-3"><div className="text-xs font-bold uppercase text-blue-300">{title}</div><div className="mt-2 text-sm text-slate-400">{children ?? empty}</div></div>;
}
