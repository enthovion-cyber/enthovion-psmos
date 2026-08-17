import { Field, SectionShell } from './section-utils';

export function ReliefTestRequirementSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="Test / Inspection Requirements" description="Frequency, due status, pop tolerance, leak test, certificates, vendor, review and scheduler controls.">
      <Field label="Test required" name="testRequired" value={values.testRequired ?? true} onChange={onChange} type="checkbox" />
      <Field label="Test type" name="testType" value={values.testType} onChange={onChange} />
      <Field label="Frequency value" name="frequencyValue" value={values.frequencyValue} onChange={onChange} type="number" />
      <Field label="Frequency unit" name="frequencyUnit" value={values.frequencyUnit ?? 'Years'} onChange={onChange} />
      <Field label="Last test date" name="lastTestDate" value={values.lastTestDate} onChange={onChange} type="date" />
      <Field label="Manual override due date" name="manualOverrideDueDate" value={values.manualOverrideDueDate} onChange={onChange} type="date" />
      <Field label="Manual override reason" name="manualOverrideReason" value={values.manualOverrideReason} onChange={onChange} />
      <Field label="Procedure document ID" name="testProcedureDocumentId" value={values.testProcedureDocumentId} onChange={onChange} />
      <Field label="Pop tolerance type" name="popPressureToleranceType" value={values.popPressureToleranceType} onChange={onChange} />
      <Field label="Pop tolerance value" name="popPressureToleranceValue" value={values.popPressureToleranceValue} onChange={onChange} type="number" />
      <Field label="Leak test required" name="leakTestRequired" value={values.leakTestRequired} onChange={onChange} type="checkbox" />
      <Field label="Seat tightness standard" name="seatTightnessStandard" value={values.seatTightnessStandard} onChange={onChange} />
      <Field label="Certificate required" name="certificateRequired" value={values.certificateRequired ?? true} onChange={onChange} type="checkbox" />
      <Field label="Third-party required" name="thirdPartyTestRequired" value={values.thirdPartyTestRequired} onChange={onChange} type="checkbox" />
      <Field label="Test vendor" name="testVendor" value={values.testVendor} onChange={onChange} />
      <Field label="Review required" name="reviewRequired" value={values.reviewRequired ?? true} onChange={onChange} type="checkbox" />
      <Field label="E-signature required" name="eSignatureRequired" value={values.eSignatureRequired} onChange={onChange} type="checkbox" />
      <Field label="Scheduler active" name="schedulerActive" value={values.schedulerActive ?? true} onChange={onChange} type="checkbox" />
    </SectionShell>
  );
}
