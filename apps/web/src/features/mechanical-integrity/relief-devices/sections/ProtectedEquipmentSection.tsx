import { Field, SectionShell } from './section-utils';

export function ProtectedEquipmentSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="Protected Equipment" description="Protected equipment relationship, pressure basis, service, isolation, relief path, and car-seal requirements.">
      <Field label="Protected equipment ID" name="protectedEquipmentId" value={values.protectedEquipmentId} onChange={onChange} />
      <Field label="Relationship type" name="relationshipType" value={values.relationshipType ?? 'Primary protection'} onChange={onChange} />
      <Field label="Protected equipment MAWP" name="protectedEquipmentMawp" value={values.protectedEquipmentMawp} onChange={onChange} type="number" />
      <Field label="Design pressure" name="protectedEquipmentDesignPressure" value={values.protectedEquipmentDesignPressure} onChange={onChange} type="number" />
      <Field label="Design temperature" name="designTemperature" value={values.designTemperature} onChange={onChange} type="number" />
      <Field label="Relief path" name="reliefPathDescription" value={values.reliefPathDescription} onChange={onChange} />
      <Field label="Upstream isolation" name="upstreamIsolation" value={values.upstreamIsolation} onChange={onChange} />
      <Field label="Downstream isolation" name="downstreamIsolation" value={values.downstreamIsolation} onChange={onChange} />
      <Field label="Primary protection" name="primaryProtection" value={values.primaryProtection ?? true} onChange={onChange} type="checkbox" />
      <Field label="Backup protection" name="backupProtection" value={values.backupProtection} onChange={onChange} type="checkbox" />
      <Field label="Shared header" name="sharedHeader" value={values.sharedHeader} onChange={onChange} type="checkbox" />
      <Field label="Car seal required" name="carSealRequired" value={values.carSealRequired} onChange={onChange} type="checkbox" />
    </SectionShell>
  );
}
