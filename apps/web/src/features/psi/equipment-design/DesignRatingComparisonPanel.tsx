import { PsiCard } from '../shared/PsiUi';
import { EquipmentDesignFieldGrid, valueOf } from './EquipmentDesignFieldGrid';

export function DesignRatingComparisonPanel({ ratings, basis }: { ratings?: Record<string, unknown> | null | undefined; basis?: Record<string, unknown> | null | undefined }) {
  return (
    <PsiCard title="Design Rating Comparison" subtitle="Pressure/temperature design basis compared against operating basis fields supplied by backend. Conflicts are calculated server-side.">
      <EquipmentDesignFieldGrid items={[
        { label: 'Design pressure', value: `${valueOf(ratings, 'design_pressure', '-')} ${valueOf(ratings, 'design_pressure_unit', '')}` },
        { label: 'MAWP', value: `${valueOf(ratings, 'mawp', '-')} ${valueOf(ratings, 'mawp_unit', '')}` },
        { label: 'MOP', value: `${valueOf(ratings, 'mop', '-')} ${valueOf(ratings, 'mop_unit', '')}` },
        { label: 'Max design temperature', value: `${valueOf(ratings, 'max_design_temperature', '-')} ${valueOf(ratings, 'temperature_unit', '')}` },
        { label: 'Service fluid', value: valueOf(basis, 'service_fluid') },
        { label: 'Fluid phase', value: valueOf(basis, 'fluid_phase') }
      ]} />
    </PsiCard>
  );
}
