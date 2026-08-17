import { EquipmentDesignFieldGrid, valueOf } from '../EquipmentDesignFieldGrid';
import { PsiCard } from '../../shared/PsiUi';
import type { EquipmentDesignDetail } from '../../types/equipment-design.types';

const serviceFlags = ['corrosive_service','toxic_service','flammable_service','reactive_service','two_phase_service','slurry_solids_service','fouling_service','erosive_service','hydrogen_service','sour_service_h2s','oxygen_service','cryogenic_service','high_temperature_service'];

export function ServiceOperatingBasisTab({ detail }: { detail: EquipmentDesignDetail }) {
  const service = detail.serviceBasis;
  return (
    <PsiCard title="Service / Operating Basis" subtitle="Fluid, phase, hazards, operating envelope, startup/shutdown, cleaning/flushing, and abnormal operating service.">
      <EquipmentDesignFieldGrid items={[
        { label: 'Service fluid', value: detail.designBasis.service_fluid ?? valueOf(service, 'service_fluid') },
        { label: 'Fluid phase', value: detail.designBasis.fluid_phase ?? valueOf(service, 'fluid_phase') },
        { label: 'Normal operating pressure', value: valueOf(service, 'normal_operating_pressure') },
        { label: 'Normal operating temperature', value: valueOf(service, 'normal_operating_temperature') },
        { label: 'Normal flow', value: valueOf(service, 'normal_flow') },
        { label: 'Operating envelope summary', value: valueOf(service, 'operating_envelope_summary') },
        { label: 'Startup / shutdown notes', value: valueOf(service, 'startup_shutdown_service_notes') },
        { label: 'Cleaning / flushing notes', value: valueOf(service, 'cleaning_flushing_service_notes') },
        { label: 'Abnormal service conditions', value: valueOf(service, 'abnormal_service_conditions') },
        ...serviceFlags.map((flag) => ({ label: flag.replace(/_/g, ' '), value: valueOf(service, flag) }))
      ]} />
    </PsiCard>
  );
}
