'use client';

import type { UseFormReturn } from 'react-hook-form';
import { detailInput, detailTextarea } from '../moc-detail-ui';
import type { ImpactFieldConfig, MOCImpactValues } from '../../schemas/moc-impact.schema';

export function ImpactQuestionField({
  field,
  form,
  locked = false
}: {
  field: ImpactFieldConfig;
  form: UseFormReturn<MOCImpactValues>;
  locked?: boolean;
}) {
  const value = form.watch(`answers.${field.key}` as any);
  const needsJustification = field.justificationWhenNo && value === false;

  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-xs transition-colors">
      <label className="mb-2 flex items-start justify-between gap-2 text-xs font-bold text-[var(--psm-fg)]">
        <span>
          {field.label} {field.required ? <span className="text-rose-500">*</span> : null}
        </span>
        {field.helper ? (
          <span className="max-w-[240px] text-right text-[10px] font-normal text-[var(--psm-muted)]">
            {field.helper}
          </span>
        ) : null}
      </label>
      {field.type === 'textarea' || field.type === 'multi' ? (
        <textarea
          disabled={locked}
          className={`${detailTextarea} disabled:opacity-60`}
          {...form.register(`answers.${field.key}` as any)}
        />
      ) : field.type === 'text' || field.type === 'date' ? (
        <input
          disabled={locked}
          type={field.type === 'date' ? 'date' : 'text'}
          className={`${detailInput} disabled:opacity-60`}
          {...form.register(`answers.${field.key}` as any)}
        />
      ) : (
        <select
          disabled={locked}
          className={`${detailInput} cursor-pointer font-semibold disabled:opacity-60`}
          value={value === true ? 'true' : value === false ? 'false' : ''}
          onChange={(event) =>
            form.setValue(
              `answers.${field.key}` as any,
              event.target.value === 'true' ? true : event.target.value === 'false' ? false : '',
              { shouldDirty: true }
            )
          }
        >
          <option value="">Not answered</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )}
      {needsJustification ? (
        <div className="mt-3">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Justification Required
          </label>
          <textarea
            disabled={locked}
            className={`${detailTextarea} disabled:opacity-60`}
            {...form.register(`justifications.${field.key}` as any)}
            placeholder="Explain why this requirement is not applicable..."
          />
        </div>
      ) : null}
    </div>
  );
}
