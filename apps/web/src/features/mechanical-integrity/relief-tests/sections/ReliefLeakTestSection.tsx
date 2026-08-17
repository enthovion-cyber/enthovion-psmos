import { Field, SectionShell } from '../../relief-devices/sections/section-utils';

export function ReliefLeakTestSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="Leak Test / Seat Tightness Result" description="Leak method, test pressure, duration, acceptance criteria, observed leakage, and pass/fail.">
      <Field label="Leak test required" name="leakTestRequired" value={values.leakTestRequired} onChange={onChange} type="checkbox" />
      <Field label="Leak test performed" name="leakTestPerformed" value={values.leakTestPerformed} onChange={onChange} type="checkbox" />
      <Field label="Leak test method" name="leakTestMethod" value={values.leakTestMethod} onChange={onChange} />
      <Field label="Test pressure" name="testPressure" value={values.testPressure} onChange={onChange} type="number" />
      <Field label="Test pressure unit" name="testPressureUnit" value={values.testPressureUnit ?? 'psig'} onChange={onChange} />
      <Field label="Duration value" name="durationValue" value={values.durationValue} onChange={onChange} type="number" />
      <Field label="Duration unit" name="durationUnit" value={values.durationUnit ?? 'minutes'} onChange={onChange} />
      <Field label="Acceptance criteria" name="acceptanceCriteria" value={values.acceptanceCriteria} onChange={onChange} />
      <Field label="Observed leakage" name="observedLeakage" value={values.observedLeakage} onChange={onChange} type="number" />
      <Field label="Observed leakage unit" name="observedLeakageUnit" value={values.observedLeakageUnit} onChange={onChange} />
      <Field label="Seat tightness result" name="seatTightnessResult" value={values.seatTightnessResult} onChange={onChange} />
      <Field label="Pass/fail" name="passFail" value={values.passFail} onChange={onChange} />
    </SectionShell>
  );
}
