'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { ImpactFieldConfig, MOCImpactValues } from '../../schemas/moc-impact.schema';

const inputClass = 'h-10 w-full rounded-lg border border-cyan-300/15 bg-slate-950/60 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-300';
const textClass = 'min-h-20 w-full rounded-lg border border-cyan-300/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-300';

export function ImpactQuestionField({ field, form, locked = false }: { field: ImpactFieldConfig; form: UseFormReturn<MOCImpactValues>; locked?: boolean }) {
  const value = form.watch(`answers.${field.key}` as any);
  const needsJustification = field.justificationWhenNo && value === false;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
      <label className="mb-2 flex items-start justify-between gap-2 text-sm font-bold text-slate-100">
        <span>{field.label} {field.required ? <span className="text-red-300">*</span> : null}</span>
        {field.helper ? <span className="max-w-[240px] text-right text-[11px] font-medium text-slate-500">{field.helper}</span> : null}
      </label>
      {field.type === 'textarea' || field.type === 'multi' ? (
        <textarea disabled={locked} className={textClass} {...form.register(`answers.${field.key}` as any)} />
      ) : field.type === 'text' || field.type === 'date' ? (
        <input disabled={locked} type={field.type === 'date' ? 'date' : 'text'} className={inputClass} {...form.register(`answers.${field.key}` as any)} />
      ) : (
        <select
          disabled={locked}
          className={inputClass}
          value={value === true ? 'true' : value === false ? 'false' : ''}
          onChange={(event) => form.setValue(`answers.${field.key}` as any, event.target.value === 'true' ? true : event.target.value === 'false' ? false : '', { shouldDirty: true })}
        >
          <option value="">Not answered</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )}
      {needsJustification ? (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-black uppercase tracking-wide text-amber-200">Justification required</label>
          <textarea disabled={locked} className={textClass} {...form.register(`justifications.${field.key}` as any)} />
        </div>
      ) : null}
    </div>
  );
}
