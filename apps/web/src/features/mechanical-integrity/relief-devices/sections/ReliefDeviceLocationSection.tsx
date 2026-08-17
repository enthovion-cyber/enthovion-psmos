import { Field, SectionShell } from './section-utils';

export function ReliefDeviceLocationSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="Location / Hierarchy" description="Company/site hierarchy, installation location, P&ID, drawings, line and rack information.">
      <Field label="Site ID" name="siteId" value={values.siteId} onChange={onChange} />
      <Field label="Unit ID" name="unitId" value={values.unitId} onChange={onChange} />
      <Field label="Area ID" name="areaId" value={values.areaId} onChange={onChange} />
      <Field label="Equipment system ID" name="equipmentSystemId" value={values.equipmentSystemId} onChange={onChange} />
      <Field label="Building/location" name="buildingLocation" value={values.buildingLocation} onChange={onChange} />
      <Field label="Installation location" name="installationLocation" value={values.installationLocation} onChange={onChange} />
      <Field label="Line number" name="lineNumber" value={values.lineNumber} onChange={onChange} />
      <Field label="P&ID" name="pAndId" value={values.pAndId} onChange={onChange} />
      <Field label="Isometric drawing" name="isometricDrawing" value={values.isometricDrawing} onChange={onChange} />
      <Field label="Installation drawing" name="installationDrawing" value={values.installationDrawing} onChange={onChange} />
      <Field label="Valve station / rack" name="valveStationOrRack" value={values.valveStationOrRack} onChange={onChange} />
    </SectionShell>
  );
}
