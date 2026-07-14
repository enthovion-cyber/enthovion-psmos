'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { DetailCard, Field, detailTextarea } from '../moc-detail-ui';
import type { MOCRiskValues } from '../../schemas/moc-risk.schema';

export function RiskRationaleForm({ register, errors, disabled }: { register: UseFormRegister<MOCRiskValues>; errors: FieldErrors<MOCRiskValues>; disabled?: boolean }) {
  return (
    <DetailCard title="Risk Rationale">
      <div className="grid gap-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <TextArea label="Safety rationale" field="safetyRationale" register={register} disabled={disabled} error={errors.safetyRationale?.message} />
          <TextArea label="Environmental rationale" field="environmentalRationale" register={register} disabled={disabled} error={errors.environmentalRationale?.message} />
          <TextArea label="Production rationale" field="productionRationale" register={register} disabled={disabled} error={errors.productionRationale?.message} />
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <TextArea label="Safety consequence / personnel exposure" field="safetyConsequence" register={register} disabled={disabled} error={errors.safetyConsequence?.message} />
          <TextArea label="Environmental consequence / emissions" field="emissionsImpact" register={register} disabled={disabled} error={errors.emissionsImpact?.message} />
          <TextArea label="Production consequence / downtime" field="downtimeImpact" register={register} disabled={disabled} error={errors.downtimeImpact?.message} />
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <TextArea label="Existing safeguards" field="existingSafeguards" register={register} disabled={disabled} />
          <TextArea label="Additional safeguards" field="additionalSafeguards" register={register} disabled={disabled} error={errors.additionalSafeguards?.message} />
          <TextArea label="Safeguards justification" field="additionalSafeguardsJustification" register={register} disabled={disabled} />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <TextArea label="Overall risk rationale" field="overallRationale" register={register} disabled={disabled} error={errors.overallRationale?.message} />
          <TextArea label="Risk acceptance statement" field="riskAcceptanceStatement" register={register} disabled={disabled} error={errors.riskAcceptanceStatement?.message} />
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <TextArea label="Additional hazards" field="additionalHazards" register={register} disabled={disabled} />
          <TextArea label="Assumptions / uncertainties" field="assumptions" register={register} disabled={disabled} />
          <TextArea label="Management justification" field="managementJustification" register={register} disabled={disabled} error={errors.managementJustification?.message} />
        </div>
      </div>
    </DetailCard>
  );
}

function TextArea({ label, field, register, disabled, error }: { label: string; field: Parameters<UseFormRegister<MOCRiskValues>>[0]; register: UseFormRegister<MOCRiskValues>; disabled?: boolean; error?: string }) {
  return <Field label={label}><textarea disabled={disabled} className={`${detailTextarea} disabled:opacity-60`} {...register(field)} />{error ? <p className="mt-1 text-xs font-bold text-red-200">{error}</p> : null}</Field>;
}
