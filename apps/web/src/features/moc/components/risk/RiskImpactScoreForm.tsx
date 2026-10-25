'use client';

import type { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { DetailCard, Field, detailInput } from '../moc-detail-ui';
import { riskLabel, riskLevel, type MOCRiskValues } from '../../schemas/moc-risk.schema';

export function RiskImpactScoreForm({
  register,
  watch,
  errors,
  disabled
}: {
  register: UseFormRegister<MOCRiskValues>;
  watch: UseFormWatch<MOCRiskValues>;
  errors: FieldErrors<MOCRiskValues>;
  disabled?: boolean | undefined;
}) {
  const safety = Number(watch('safetyScore') ?? 0);
  const environmental = Number(watch('environmentalScore') ?? 0);
  const production = Number(watch('productionScore') ?? 0);
  const total = safety + environmental + production;

  return (
    <DetailCard
      title="HAZOP Impact Vector Scoring"
      action={
        <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          Evaluated: {total} / 9 · {riskLevel(total)}
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScoreField
          label="Safety Impact"
          field="safetyScore"
          value={safety}
          register={register}
          disabled={disabled}
          error={errors.safetyScore?.message}
        />
        <ScoreField
          label="Environmental Impact"
          field="environmentalScore"
          value={environmental}
          register={register}
          disabled={disabled}
          error={errors.environmentalScore?.message}
        />
        <ScoreField
          label="Production / Asset Impact"
          field="productionScore"
          value={production}
          register={register}
          disabled={disabled}
          error={errors.productionScore?.message}
        />
      </div>
    </DetailCard>
  );
}

function ScoreField({
  label,
  field,
  value,
  register,
  disabled,
  error
}: {
  label: string;
  field: Parameters<UseFormRegister<MOCRiskValues>>[0];
  value: number;
  register: UseFormRegister<MOCRiskValues>;
  disabled?: boolean | undefined;
  error?: string | undefined;
}) {
  const severityTones = [
    'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
    'border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400',
    'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400',
    'border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400'
  ];

  return (
    <Field label={`${label} *`}>
      <div className={`rounded-xl border p-3.5 transition-colors ${severityTones[value] ?? severityTones[0]}`}>
        <select
          disabled={disabled}
          className={`${detailInput} font-bold cursor-pointer disabled:opacity-60`}
          {...register(field)}
        >
          <option value={0}>0 - None (No Safety Impact)</option>
          <option value={1}>1 - Minor (On-site First Aid / Controlled)</option>
          <option value={2}>2 - Significant (Reportable / Equipment Damage)</option>
          <option value={3}>3 - Major (Severe Injury / Loss of Containment)</option>
        </select>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-[var(--psm-muted)] font-medium">Selected Severity:</span>
          <span className="font-bold">{riskLabel(value)}</span>
        </div>
        {error ? <p className="mt-2 text-xs font-bold text-rose-500">{error}</p> : null}
      </div>
    </Field>
  );
}
