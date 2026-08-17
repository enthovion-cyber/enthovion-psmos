import { Field, SectionShell } from '../../relief-devices/sections/section-utils';

export function ReliefTestContextSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="Test Context" description="Planned/unplanned status, location, vendor, technician, procedure, and test medium.">
      <Field label="Relief device ID" name="reliefDeviceId" value={values.reliefDeviceId} onChange={onChange} required />
      <Field label="Protected equipment ID" name="protectedEquipmentId" value={values.protectedEquipmentId} onChange={onChange} />
      <Field label="Occurrence ID" name="occurrenceId" value={values.occurrenceId} onChange={onChange} />
      <Field label="Test date" name="testDate" value={values.testDate} onChange={onChange} type="date" required />
      <Field label="Test type" name="testType" value={values.testType ?? 'As-found / as-left'} onChange={onChange} />
      <Field label="Test location" name="testLocation" value={values.testLocation} onChange={onChange} />
      <Field label="Planned" name="planned" value={values.planned ?? true} onChange={onChange} type="checkbox" />
      <Field label="Unplanned reason" name="unplannedReason" value={values.unplannedReason} onChange={onChange} />
      <Field label="Removed for test" name="removedForTest" value={values.removedForTest} onChange={onChange} type="checkbox" />
      <Field label="Tested in place" name="testedInPlace" value={values.testedInPlace} onChange={onChange} type="checkbox" />
      <Field label="Test vendor" name="testVendor" value={values.testVendor} onChange={onChange} />
      <Field label="Technician name" name="technicianName" value={values.technicianName} onChange={onChange} />
      <Field label="Inspector user ID" name="inspectorUserId" value={values.inspectorUserId} onChange={onChange} />
      <Field label="Reviewer user ID" name="reviewerUserId" value={values.reviewerUserId} onChange={onChange} />
      <Field label="Procedure document ID" name="procedureDocumentId" value={values.procedureDocumentId} onChange={onChange} />
      <Field label="Test medium" name="testMedium" value={values.testMedium} onChange={onChange} />
      <Field label="Ambient conditions" name="ambientConditions" value={values.ambientConditions} onChange={onChange} />
    </SectionShell>
  );
}
