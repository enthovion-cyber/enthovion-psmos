'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Badge } from '../moc-detail-ui';
import { ImpactQuestionField } from './ImpactQuestionField';
import type { ImpactSectionConfig, MOCImpactValues } from '../../schemas/moc-impact.schema';

export function ImpactSection({
  config,
  form,
  locked = false
}: {
  config: ImpactSectionConfig;
  form: UseFormReturn<MOCImpactValues>;
  locked?: boolean | undefined;
}) {
  const fields = config.fields;
  const answered = fields.filter((field) => {
    const value = form.watch(`answers.${field.key}` as any);
    return value !== undefined && value !== '';
  }).length;
  const yesCount = fields.filter((field) => form.watch(`answers.${field.key}` as any) === true).length;
  const requiredMissing = fields.filter(
    (field) =>
      field.required &&
      (form.watch(`answers.${field.key}` as any) === undefined || form.watch(`answers.${field.key}` as any) === '')
  ).length;

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm transition-colors text-[var(--psm-fg)]">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-bold text-[var(--psm-fg)]">{config.title}</h3>
          <p className="mt-1 max-w-4xl text-xs text-[var(--psm-muted)]">{config.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge tone={requiredMissing ? 'red' : 'green'}>
            {requiredMissing ? `${requiredMissing} missing` : 'Required OK'}
          </Badge>
          <Badge tone="blue">
            {answered}/{fields.length} answered
          </Badge>
          <Badge tone={yesCount ? 'amber' : 'slate'}>{yesCount} yes</Badge>
        </div>
      </div>
      {requiredMissing ? (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
          Complete all mandatory questions in this section prior to submitting for review.
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {fields.map((field) => (
          <ImpactQuestionField key={field.key} field={field} form={form} locked={locked} />
        ))}
      </div>
    </section>
  );
}
