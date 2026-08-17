import { Field, SectionShell } from '../../relief-devices/sections/section-utils';

export function ReliefAsLeftSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="As-Left Test Results" description="As-left set/pop pressure, leak result, seat condition, final set pressure, and ready-for-installation flag.">
      <Field label="As-left set pressure" name="asLeftSetPressure" value={values.asLeftSetPressure} onChange={onChange} type="number" />
      <Field label="As-left pop pressure" name="asLeftPopPressure" value={values.asLeftPopPressure} onChange={onChange} type="number" />
      <Field label="As-left leak result" name="asLeftLeakResult" value={values.asLeftLeakResult} onChange={onChange} />
      <Field label="As-left seat condition" name="asLeftSeatCondition" value={values.asLeftSeatCondition} onChange={onChange} />
      <Field label="Final set pressure" name="finalSetPressure" value={values.finalSetPressure} onChange={onChange} type="number" />
      <Field label="Ready for installation" name="readyForInstallation" value={values.readyForInstallation} onChange={onChange} type="checkbox" />
    </SectionShell>
  );
}
