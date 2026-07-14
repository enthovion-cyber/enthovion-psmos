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
      <div className="grid gap-4 lg:grid-cols-3">
        <Summary title="Change information" rows={[values.title, values.changeType, values.changeCategory, values.priority]} />
        <Summary title="Location / equipment" rows={[values.siteId, values.unitId, values.areaId, `${values.equipmentIds.length} equipment selected`]} />
        <Summary title="Risk ranking" rows={[`Score ${risk.score}`, risk.level, `Safety ${values.risk.safetyImpact}`, `Environment ${values.risk.environmentalImpact}`, `Production ${values.risk.productionImpact}`]} />
      </div>
      <div className="mt-4 rounded-lg border border-cyan-300/10 bg-slate-950/35 p-4">
        <h3 className="font-bold text-white">Missing requirements checklist</h3>
        {missing.length ? <ul className="mt-2 list-inside list-disc text-sm text-red-200">{missing.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-emerald-200">All visible wizard validations are complete.</p>}
      </div>
    </StepShell>
  );
}

function Summary({ title, rows }: { title: string; rows: Array<string | undefined> }) {
  return <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 p-4"><h3 className="text-sm font-bold text-white">{title}</h3><div className="mt-3 space-y-1 text-sm text-slate-300">{rows.filter(Boolean).map((row) => <p key={row}>{row}</p>)}</div></div>;
}
