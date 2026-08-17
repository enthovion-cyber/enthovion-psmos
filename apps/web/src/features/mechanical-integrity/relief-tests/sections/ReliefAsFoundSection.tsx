import { Field, SectionShell } from '../../relief-devices/sections/section-utils';

export function ReliefAsFoundSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="As-Found Pop Test / Set Pressure Verification" description="Nameplate, required set pressure, as-found pop pressure, seat condition, and as-found leak result.">
      <Field label="Nameplate set pressure" name="nameplateSetPressure" value={values.nameplateSetPressure} onChange={onChange} type="number" />
      <Field label="Required set pressure" name="requiredSetPressure" value={values.requiredSetPressure} onChange={onChange} type="number" />
      <Field label="Pressure unit" name="pressureUnit" value={values.pressureUnit ?? 'psig'} onChange={onChange} />
      <Field label="As-found pop pressure" name="asFoundPopPressure" value={values.asFoundPopPressure} onChange={onChange} type="number" />
      <Field label="As-found leak result" name="asFoundLeakResult" value={values.asFoundLeakResult} onChange={onChange} />
      <Field label="As-found seat condition" name="asFoundSeatCondition" value={values.asFoundSeatCondition} onChange={onChange} />
    </SectionShell>
  );
}
