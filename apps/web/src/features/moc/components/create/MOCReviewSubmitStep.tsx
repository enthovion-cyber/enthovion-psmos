'use client';

import { useFormContext } from 'react-hook-form';
import { riskFromValues, type MOCCreateValues } from '../../schemas/moc.schema';
import { StepShell } from './create-ui';

export function MOCReviewSubmitStep() {
  const { watch, formState: { errors } } = useFormContext<MOCCreateValues>();
  const values = watch();
  const risk = riskFromValues(values);
  const missing = Object.keys(errors);
  return (
    <StepShell eyebrow="Step 9" title="Review & Submit">
      <div className="grid gap-4 md:grid-cols-3">
        <Summary title="Change Information" rows={[values.title, values.changeType, values.changeCategory, values.priority]} />
        <Summary title="Location / Equipment" rows={[values.siteId, values.unitId, values.areaId, `${values.equipmentIds.length} equipment selected`]} />
        <Summary title="Risk Ranking" rows={[`Score ${risk.score}`, risk.level, `Safety ${values.risk.safetyImpact}`, `Environment ${values.risk.environmentalImpact}`, `Production ${values.risk.productionImpact}`]} />
      </div>
      <div className="mt-6 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-5">
        <h3 className="font-bold text-[var(--psm-fg)]">Missing Requirements Checklist</h3>
        {missing.length ? (
          <ul className="mt-2 list-inside list-disc text-sm text-red-600 dark:text-red-400">
            {missing.map((item) => <li key={item}>{item}</li>)}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">All wizard requirements and schema validations are fulfilled.</p>
        )}
      </div>
    </StepShell>
  );
}

function Summary({ title, rows }: { title: string; rows: Array<string | undefined> }) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
      <h3 className="text-sm font-bold text-[var(--psm-fg)]">{title}</h3>
      <div className="mt-3 space-y-1 text-sm text-[var(--psm-muted)]">
        {rows.filter(Boolean).map((row) => <p key={row}>{row}</p>)}
      </div>
    </div>
  );
}
