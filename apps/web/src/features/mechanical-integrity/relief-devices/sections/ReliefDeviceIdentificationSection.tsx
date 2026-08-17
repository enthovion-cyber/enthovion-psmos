import { Field, SectionShell } from './section-utils';

export function ReliefDeviceIdentificationSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="Device Identification" description="Tag, type, manufacturer, asset identity, status, owner, and vendor data.">
      <Field label="Relief device tag" name="deviceTag" value={values.deviceTag} onChange={onChange} required />
      <Field label="Device name" name="deviceName" value={values.deviceName} onChange={onChange} />
      <Field label="Device type" name="deviceType" value={values.deviceType ?? 'PSV'} onChange={onChange} required />
      <Field label="Device category" name="deviceCategory" value={values.deviceCategory} onChange={onChange} />
      <Field label="Manufacturer" name="manufacturer" value={values.manufacturer} onChange={onChange} />
      <Field label="Model" name="model" value={values.model} onChange={onChange} />
      <Field label="Serial number" name="serialNumber" value={values.serialNumber} onChange={onChange} />
      <Field label="Asset number" name="assetNumber" value={values.assetNumber} onChange={onChange} />
      <Field label="Installation date" name="installationDate" value={values.installationDate} onChange={onChange} type="date" />
      <Field label="Commissioning date" name="commissioningDate" value={values.commissioningDate} onChange={onChange} type="date" />
      <Field label="Status" name="status" value={values.status ?? 'Active'} onChange={onChange} />
      <Field label="Owner department" name="ownerDepartment" value={values.ownerDepartment} onChange={onChange} />
      <Field label="Custodian user ID" name="custodianUserId" value={values.custodianUserId} onChange={onChange} />
      <Field label="Vendor" name="vendorName" value={values.vendorName} onChange={onChange} />
      <Field label="Safety-critical" name="safetyCritical" value={values.safetyCritical ?? true} onChange={onChange} type="checkbox" />
      <Field label="PSM critical" name="psmCritical" value={values.psmCritical} onChange={onChange} type="checkbox" />
    </SectionShell>
  );
}
