'use client';

import { useFormContext } from 'react-hook-form';
import type { MOCCreateValues } from '../../schemas/moc.schema';
import { Field, inputClass, StepShell, textAreaClass } from './create-ui';

const checks = [
  ['affectsEquipment', 'Does this change affect equipment?'], ['pidUpdateRequired', 'Is P&ID update required?'], ['datasheetUpdateRequired', 'Is datasheet update required?'], ['equipmentRegistryUpdateRequired', 'Is equipment registry update required?'],
  ['affectsProcessChemistry', 'Does this affect process chemistry?'], ['sdsUpdateRequired', 'SDS update required?'], ['psiUpdateRequired', 'PSI update required?'], ['exposureLimitsAffected', 'Exposure limits affected?'], ['environmentalImpactAffected', 'Environmental impact affected?'],
  ['sopUpdateRequired', 'SOP update required?'], ['operatingProcedureUpdateRequired', 'Operating procedure update required?'], ['emergencyProcedureUpdateRequired', 'Emergency procedure update required?'],
  ['operatingLimitsChanged', 'Operating limits changed?'], ['hazopDeviationReviewRequired', 'HAZOP deviation review required?'], ['alarmInterlockSetpointsChanged', 'Alarm/interlock setpoints changed?'], ['safeOperatingEnvelopeChanged', 'Safe operating envelope changed?'],
  ['sisAffected', 'SIS affected?'], ['esdAffected', 'ESD affected?'], ['psvAffected', 'PSV affected?'], ['alarmSystemAffected', 'Alarm system affected?'], ['lopaReviewRequired', 'LOPA review required?'], ['sisRevalidationRequired', 'SIS revalidation required?'],
  ['trainingRequired', 'Training required?'], ['trainingBeforeStartup', 'Training must be complete before startup?'],
  ['documentControlUpdateRequired', 'Document Control update required?'], ['pidRevisionRequired', 'P&ID revision required?'], ['drawingUpdateRequired', 'Drawing update required?'], ['designBasisUpdateRequired', 'Design basis update required?'], ['vendorManualUpdateRequired', 'Vendor manual update required?']
] as const;

export function MOCImpactAssessmentStep() {
  const { register, watch, setValue } = useFormContext<MOCCreateValues>();
  const impact = watch('impactAssessment') ?? {};
  const setBool = (key: string, value: boolean) => {
    const next = { ...impact, [key]: value };
    if (key === 'sisAffected' && value) { next.lopaReviewRequired = true; next.sisRevalidationRequired = true; }
    if (key === 'operatingLimitsChanged' && value) next.hazopDeviationReviewRequired = true;
    setValue('impactAssessment', next, { shouldDirty: true });
  };
  return (
    <StepShell eyebrow="Step 5" title="Impact Assessment">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setBool(key, !impact[key])}
            className={`rounded-xl border p-3.5 text-left text-sm font-semibold transition-all ${
              impact[key]
                ? 'border-primary bg-primary/10 text-[var(--psm-fg)] shadow-sm'
                : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)] hover:border-primary/50 hover:text-[var(--psm-fg)]'
            }`}
          >
            <span>{label}</span>
            <span className={`mt-2 block text-xs font-bold ${impact[key] ? 'text-primary' : 'text-[var(--psm-muted)]'}`}>
              {impact[key] ? 'Yes' : 'No'}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Field label="Chemicals affected"><input className={inputClass} {...register('impactAssessment.chemicalsAffected')} /></Field>
        <Field label="Which SOPs are affected?"><input className={inputClass} {...register('impactAssessment.affectedSops')} /></Field>
        <Field label="Affected roles"><input className={inputClass} {...register('impactAssessment.affectedRoles')} /></Field>
        <Field label="Written justification if P&ID update is No"><textarea className={textAreaClass} {...register('impactAssessment.pidNoJustification')} /></Field>
      </div>
    </StepShell>
  );
}
