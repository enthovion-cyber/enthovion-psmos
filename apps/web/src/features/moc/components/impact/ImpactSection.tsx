'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Badge } from '../moc-detail-ui';
import { ImpactQuestionField } from './ImpactQuestionField';
import type { ImpactSectionConfig, MOCImpactValues } from '../../schemas/moc-impact.schema';

export function ImpactSection({ config, form, locked = false }: { config: ImpactSectionConfig; form: UseFormReturn<MOCImpactValues>; locked?: boolean }) {
  const fields = config.fields;
  const answered = fields.filter((field) => {
    const value = form.watch(`answers.${field.key}` as any);
    return value !== undefined && value !== '';
  }).length;
  const yesCount = fields.filter((field) => form.watch(`answers.${field.key}` as any) === true).length;
  const requiredMissing = fields.filter((field) => field.required && (form.watch(`answers.${field.key}` as any) === undefined || form.watch(`answers.${field.key}` as any) === '')).length;

  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-4 shadow-xl shadow-black/10">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-black text-white">{config.title}</h3>
          <p className="mt-1 max-w-4xl text-sm text-slate-400">{config.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge tone={requiredMissing ? 'red' : 'green'}>{requiredMissing ? `${requiredMissing} missing` : 'Required OK'}</Badge>
          <Badge tone="blue">{answered}/{fields.length} answered</Badge>
          <Badge tone={yesCount ? 'amber' : 'slate'}>{yesCount} yes</Badge>
        </div>
      </div>
      {requiredMissing ? <div className="mb-4 rounded-lg border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100">Section-level missing answer warning: complete required questions before completing the assessment.</div> : null}
      <div className="grid gap-3 xl:grid-cols-2">
        {fields.map((field) => <ImpactQuestionField key={field.key} field={field} form={form} locked={locked} />)}
      </div>
    </section>
  );
}
