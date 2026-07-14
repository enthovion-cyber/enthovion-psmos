'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { PermitCreateValues } from '../schemas/permit.schema';
import { Field, Grid, Input, StepPanel } from './PermitWizardFields';

export function PermitWorkforceStep() {
  const { control, register } = useFormContext<PermitCreateValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'workers' });

  return (
    <StepPanel title="Step 7 - Workforce & Contractors" subtitle="Permit Holder, Performing Authority, Permit Issuer, Area Authority, Contractor Company, Supervisor, worker roster, and PTW briefing acknowledgement.">
      <Grid>
        <Field name="permitHolder" label="Permit Holder" required><Input name="permitHolder" /></Field>
        <Field name="performingAuthority" label="Performing Authority" required><Input name="performingAuthority" /></Field>
        <Field name="permitIssuer" label="Permit Issuer"><Input name="permitIssuer" /></Field>
        <Field name="areaAuthority" label="Area Authority" required><Input name="areaAuthority" /></Field>
        <Field name="contractorCompany" label="Contractor Company"><Input name="contractorCompany" /></Field>
        <Field name="contractorCompanyId" label="Contractor company lookup"><Input name="contractorCompanyId" /></Field>
        <Field name="supervisor" label="Supervisor"><Input name="supervisor" /></Field>
        <Field name="maxPersonnel" label="Maximum personnel count"><Input name="maxPersonnel" type="number" /></Field>
      </Grid>
      <div className="mt-5 rounded-lg border border-cyan-300/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-300/10 p-3">
          <div>
            <div className="text-sm font-bold text-white">Workers Table</div>
            <div className="text-xs text-slate-400">At least one worker is required. Contractor company is required if external workers are included.</div>
          </div>
          <button
            type="button"
            className="ptw-toolbar-button"
            onClick={() => append({ workerName: '', company: '', trade: '', badgeId: '', contactNumber: '', briefingRequired: true, briefingCompleted: false, signInRequired: true, emergencyContact: '' })}
          >
            <Plus size={14} /> Add worker
          </button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-[1200px] w-full text-left text-sm">
            <thead className="bg-black/20 text-xs uppercase text-slate-400">
              <tr>{['Worker Name', 'Company', 'Trade', 'Badge ID', 'Contact Number', 'Briefing Required', 'Briefing Completed', 'Sign-in Required', 'Emergency Contact', ''].map((head) => <th key={head} className="p-2">{head}</th>)}</tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="border-t border-cyan-300/10">
                  <td className="p-2"><input className="ptw-input w-full" {...register(`workers.${index}.workerName`)} /></td>
                  <td className="p-2"><input className="ptw-input w-full" {...register(`workers.${index}.company`)} /></td>
                  <td className="p-2"><input className="ptw-input w-full" {...register(`workers.${index}.trade`)} /></td>
                  <td className="p-2"><input className="ptw-input w-full" {...register(`workers.${index}.badgeId`)} /></td>
                  <td className="p-2"><input className="ptw-input w-full" {...register(`workers.${index}.contactNumber`)} /></td>
                  <td className="p-2"><input type="checkbox" className="h-4 w-4 accent-blue-500" {...register(`workers.${index}.briefingRequired`)} /></td>
                  <td className="p-2"><input type="checkbox" className="h-4 w-4 accent-blue-500" {...register(`workers.${index}.briefingCompleted`)} /></td>
                  <td className="p-2"><input type="checkbox" className="h-4 w-4 accent-blue-500" {...register(`workers.${index}.signInRequired`)} /></td>
                  <td className="p-2"><input className="ptw-input w-full" {...register(`workers.${index}.emergencyContact`)} /></td>
                  <td className="p-2"><button type="button" className="text-red-300" onClick={() => remove(index)}><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!fields.length ? <div className="p-5 text-center text-sm text-slate-400">No worker added. Add at least one worker before submitting for approval.</div> : null}
        </div>
      </div>
    </StepPanel>
  );
}
