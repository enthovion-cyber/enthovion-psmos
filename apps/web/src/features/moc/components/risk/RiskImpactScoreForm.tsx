'use client';

import type { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Field } from '../moc-detail-ui';
import { riskLabel, riskLevel, type MOCRiskValues } from '../../schemas/moc-risk.schema';

export function RiskImpactScoreForm({ register, watch, errors, disabled }: { register: UseFormRegister<MOCRiskValues>; watch: UseFormWatch<MOCRiskValues>; errors: FieldErrors<MOCRiskValues>; disabled?: boolean }) {
  const safety = Number(watch('safetyScore') ?? 0);
  const environmental = Number(watch('environmentalScore') ?? 0);
  const production = Number(watch('productionScore') ?? 0);
  const total = safety + environmental + production;
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-4 shadow-xl shadow-black/10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-wide text-white">Impact Score Form</h2>
        <span className="rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-200">Preview: {total} / 9 {riskLevel(total)}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <ScoreField label="Safety Impact" field="safetyScore" value={safety} register={register} disabled={disabled} error={errors.safetyScore?.message} />
        <ScoreField label="Environmental Impact" field="environmentalScore" value={environmental} register={register} disabled={disabled} error={errors.environmentalScore?.message} />
        <ScoreField label="Production Impact" field="productionScore" value={production} register={register} disabled={disabled} error={errors.productionScore?.message} />
      </div>
    </div>
  );
}

function ScoreField({ label, field, value, register, disabled, error }: { label: string; field: Parameters<UseFormRegister<MOCRiskValues>>[0]; value: number; register: UseFormRegister<MOCRiskValues>; disabled?: boolean; error?: string }) {
  const tones = ['border-emerald-300/20 text-emerald-200', 'border-blue-300/20 text-blue-200', 'border-amber-300/25 text-amber-200', 'border-red-300/25 text-red-200'];
  return (
    <Field label={`${label} *`}>
      <div className={`rounded-lg border bg-slate-950/35 p-3 ${tones[value] ?? tones[0]}`}>
        <select disabled={disabled} className="h-11 w-full rounded-md border border-white/10 bg-slate-950/80 px-3 text-sm font-bold text-white outline-none focus:border-blue-300 disabled:opacity-60" {...register(field)}>
          <option value={0}>0 - None</option>
          <option value={1}>1 - Minor</option>
          <option value={2}>2 - Significant</option>
          <option value={3}>3 - Major</option>
        </select>
        <div className="mt-3 flex items-center justify-between text-xs"><span>Selected severity</span><b>{riskLabel(value)}</b></div>
        {error ? <p className="mt-2 text-xs font-bold text-red-200">{error}</p> : null}
      </div>
    </Field>
  );
}
