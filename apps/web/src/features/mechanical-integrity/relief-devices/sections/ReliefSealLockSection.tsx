import { Field, SectionShell } from './section-utils';

export function ReliefSealLockSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="Seal / Lock / Car-Seal Data" description="Seal requirement, lock status, valve position, broken/restored details, and verification schedule.">
      <Field label="Seal required" name="sealRequired" value={values.sealRequired} onChange={onChange} type="checkbox" />
      <Field label="Seal number" name="sealNumber" value={values.sealNumber} onChange={onChange} />
      <Field label="Seal status" name="sealStatus" value={values.sealStatus} onChange={onChange} />
      <Field label="Car seal status" name="carSealStatus" value={values.carSealStatus} onChange={onChange} />
      <Field label="Lock status" name="lockStatus" value={values.lockStatus} onChange={onChange} />
      <Field label="Upstream valve status" name="upstreamValveStatus" value={values.upstreamValveStatus} onChange={onChange} />
      <Field label="Downstream valve status" name="downstreamValveStatus" value={values.downstreamValveStatus} onChange={onChange} />
      <Field label="Seal installed by" name="sealInstalledBy" value={values.sealInstalledBy} onChange={onChange} />
      <Field label="Seal broken" name="sealBroken" value={values.sealBroken} onChange={onChange} type="checkbox" />
      <Field label="Seal broken reason" name="sealBrokenReason" value={values.sealBrokenReason} onChange={onChange} />
      <Field label="Seal inspection frequency" name="sealInspectionFrequencyValue" value={values.sealInspectionFrequencyValue} onChange={onChange} type="number" />
      <Field label="Seal inspection unit" name="sealInspectionFrequencyUnit" value={values.sealInspectionFrequencyUnit} onChange={onChange} />
      <Field label="Last seal verification" name="lastSealVerification" value={values.lastSealVerification} onChange={onChange} type="date" />
      <Field label="Next seal verification due" name="nextSealVerificationDue" value={values.nextSealVerificationDue} onChange={onChange} type="date" />
    </SectionShell>
  );
}
