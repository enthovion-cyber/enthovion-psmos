import { Field, SectionShell } from './section-utils';

export function ReliefTechnicalDataSection({ values, onChange }: { values: Record<string, unknown>; onChange: (name: string, value: string | boolean) => void }) {
  return (
    <SectionShell title="Relief Device Technical Data" description="Pressure, capacity, service, material, valve details, and rupture disk data.">
      <Field label="Set pressure" name="setPressure" value={values.setPressure} onChange={onChange} type="number" />
      <Field label="Set pressure unit" name="setPressureUnit" value={values.setPressureUnit ?? 'psig'} onChange={onChange} />
      <Field label="CDTP" name="coldDifferentialTestPressure" value={values.coldDifferentialTestPressure} onChange={onChange} type="number" />
      <Field label="MAWP reference" name="mawpReference" value={values.mawpReference} onChange={onChange} type="number" />
      <Field label="Accumulation %" name="accumulationPercent" value={values.accumulationPercent} onChange={onChange} type="number" />
      <Field label="Backpressure" name="backpressure" value={values.backpressure} onChange={onChange} type="number" />
      <Field label="Operating pressure" name="operatingPressure" value={values.operatingPressure} onChange={onChange} type="number" />
      <Field label="Blowdown" name="blowdown" value={values.blowdown} onChange={onChange} type="number" />
      <Field label="Rated capacity" name="ratedCapacity" value={values.ratedCapacity} onChange={onChange} type="number" />
      <Field label="Required relieving capacity" name="requiredRelievingCapacity" value={values.requiredRelievingCapacity} onChange={onChange} type="number" />
      <Field label="Capacity unit" name="capacityUnit" value={values.capacityUnit} onChange={onChange} />
      <Field label="Orifice designation" name="orificeDesignation" value={values.orificeDesignation} onChange={onChange} />
      <Field label="Inlet size/rating" name="inletSize" value={values.inletSize} onChange={onChange} />
      <Field label="Outlet size/rating" name="outletSize" value={values.outletSize} onChange={onChange} />
      <Field label="Service fluid" name="serviceFluid" value={values.serviceFluid} onChange={onChange} />
      <Field label="Phase" name="phase" value={values.phase} onChange={onChange} />
      <Field label="Relieving temperature" name="relievingTemperature" value={values.relievingTemperature} onChange={onChange} type="number" />
      <Field label="Body material" name="bodyMaterial" value={values.bodyMaterial} onChange={onChange} />
      <Field label="Trim material" name="trimMaterial" value={values.trimMaterial} onChange={onChange} />
      <Field label="Seat material" name="seatMaterial" value={values.seatMaterial} onChange={onChange} />
      <Field label="Pilot type" name="pilotType" value={values.pilotType} onChange={onChange} />
      <Field label="Rupture disk burst pressure" name="ruptureDiskBurstPressure" value={values.ruptureDiskBurstPressure} onChange={onChange} type="number" />
      <Field label="Corrosive service" name="corrosiveService" value={values.corrosiveService} onChange={onChange} type="checkbox" />
      <Field label="Toxic service" name="toxicService" value={values.toxicService} onChange={onChange} type="checkbox" />
      <Field label="Flammable service" name="flammableService" value={values.flammableService} onChange={onChange} type="checkbox" />
      <Field label="Sour H2S service" name="sourH2sService" value={values.sourH2sService} onChange={onChange} type="checkbox" />
    </SectionShell>
  );
}
