import { EquipmentDesignFieldGrid, valueOf } from '../EquipmentDesignFieldGrid';
import { PsiCard } from '../../shared/PsiUi';
import type { EquipmentDesignDetail } from '../../types/equipment-design.types';

export function CapacityPerformanceTab({ detail }: { detail: EquipmentDesignDetail }) {
  const capacity = detail.capacityBasis;
  return (
    <PsiCard title="Capacity / Performance Basis" subtitle="Design capacity, flows, inventory, duty, efficiency, residence time, and equipment-specific performance assumptions.">
      <EquipmentDesignFieldGrid items={[
        { label: 'Design capacity', value: `${valueOf(capacity, 'design_capacity', '-')} ${valueOf(capacity, 'capacity_unit', '')}` },
        { label: 'Normal capacity', value: valueOf(capacity, 'normal_capacity') },
        { label: 'Design flow', value: `${valueOf(capacity, 'design_flow', '-')} ${valueOf(capacity, 'flow_unit', '')}` },
        { label: 'Minimum flow', value: valueOf(capacity, 'minimum_flow') },
        { label: 'Maximum flow', value: valueOf(capacity, 'maximum_flow') },
        { label: 'Pressure drop', value: valueOf(capacity, 'pressure_drop') },
        { label: 'Duty', value: `${valueOf(capacity, 'duty', '-')} ${valueOf(capacity, 'duty_unit', '')}` },
        { label: 'Efficiency', value: valueOf(capacity, 'efficiency') },
        { label: 'Design inventory volume', value: valueOf(capacity, 'design_inventory_volume') },
        { label: 'Maximum intended inventory', value: valueOf(capacity, 'maximum_intended_inventory') },
        { label: 'Residence time', value: valueOf(capacity, 'residence_time') },
        { label: 'Performance basis notes', value: valueOf(capacity, 'performance_basis_notes') }
      ]} />
    </PsiCard>
  );
}
