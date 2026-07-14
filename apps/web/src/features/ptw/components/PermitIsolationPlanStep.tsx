'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { PermitCreateValues } from '../schemas/permit.schema';
import { Check, Field, Grid, Input, Select, StepPanel, Textarea } from './PermitWizardFields';

export function PermitIsolationPlanStep() {
  const { control, register } = useFormContext<PermitCreateValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'isolationPoints' });
  return (
    <StepPanel title="Step 5 - Isolation / LOTO Plan" subtitle="Isolation Required, Isolation Plan Description, Isolation Authority, Energy Sources, and Isolation Points Table.">
      <Grid>
        <Check name="isolationRequired" label="Isolation Required" />
        <Field name="isolationPlanDescription" label="Isolation Plan Description"><Textarea name="isolationPlanDescription" /></Field>
        <Field name="isolationAuthority" label="Isolation Authority"><Input name="isolationAuthority" /></Field>
        <Field name="isolationEnergySources" label="Energy Sources"><Input name="isolationEnergySources" /></Field>
      </Grid>
      <div className="mt-5 rounded-lg border border-cyan-300/10">
        <div className="flex items-center justify-between border-b border-cyan-300/10 p-3">
          <div className="text-sm font-bold text-white">Isolation Points Table</div>
          <div className="flex gap-2">
            <button type="button" className="ptw-toolbar-button" onClick={() => append({ energyType: 'Mechanical', isolationPointTag: '', valveOrBreakerTag: '', requiredPosition: 'Closed', lockNumber: '', holderName: '', verificationRequired: true, notes: '' })}><Plus size={14} /> Add isolation point</button>
            <button type="button" className="ptw-toolbar-button">Import isolation points from Equipment Registry</button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="bg-black/20 text-xs uppercase text-slate-400"><tr>{['Energy Type', 'Isolation Point Tag', 'Valve Tag / Breaker Tag', 'Required Position', 'Lock Number', 'Holder Name', 'Verification Required', 'Notes', ''].map((head) => <th key={head} className="p-2">{head}</th>)}</tr></thead>
            <tbody>{fields.map((field, index) => <tr key={field.id} className="border-t border-cyan-300/10"><td className="p-2"><input className="ptw-input w-full" {...register(`isolationPoints.${index}.energyType`)} /></td><td className="p-2"><input className="ptw-input w-full" {...register(`isolationPoints.${index}.isolationPointTag`)} /></td><td className="p-2"><input className="ptw-input w-full" {...register(`isolationPoints.${index}.valveOrBreakerTag`)} /></td><td className="p-2"><select className="ptw-input w-full" {...register(`isolationPoints.${index}.requiredPosition`)}>{['Open', 'Closed', 'Locked', 'Blinded', 'Disconnected'].map((item) => <option key={item}>{item}</option>)}</select></td><td className="p-2"><input className="ptw-input w-full" {...register(`isolationPoints.${index}.lockNumber`)} /></td><td className="p-2"><input className="ptw-input w-full" {...register(`isolationPoints.${index}.holderName`)} /></td><td className="p-2"><input type="checkbox" className="h-4 w-4 accent-blue-500" {...register(`isolationPoints.${index}.verificationRequired`)} /></td><td className="p-2"><input className="ptw-input w-full" {...register(`isolationPoints.${index}.notes`)} /></td><td className="p-2"><button type="button" className="text-red-300" onClick={() => remove(index)}><Trash2 size={16} /></button></td></tr>)}</tbody>
          </table>
          {!fields.length ? <div className="p-5 text-center text-sm text-slate-400">No isolation point added. If Isolation Required = true, at least one isolation point is required. LOTO permit type always requires isolation plan.</div> : null}
        </div>
      </div>
    </StepPanel>
  );
}
