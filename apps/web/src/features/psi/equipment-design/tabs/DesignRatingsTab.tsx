import { DesignRatingComparisonPanel } from '../DesignRatingComparisonPanel';
import { EquipmentDesignFieldGrid, valueOf } from '../EquipmentDesignFieldGrid';
import { PsiCard } from '../../shared/PsiUi';
import type { EquipmentDesignDetail } from '../../types/equipment-design.types';

export function DesignRatingsTab({ detail }: { detail: EquipmentDesignDetail }) {
  const ratings = detail.ratings;
  return (
    <div className="space-y-5">
      <DesignRatingComparisonPanel ratings={ratings} basis={detail.designBasis} />
      <PsiCard title="Pressure / Temperature / Test Ratings" subtitle="PDF-required design ratings and safe operating envelope foundation.">
        <EquipmentDesignFieldGrid items={[
          { label: 'Design pressure', value: `${valueOf(ratings, 'design_pressure', '-')} ${valueOf(ratings, 'design_pressure_unit', '')}` },
          { label: 'MAWP', value: `${valueOf(ratings, 'mawp', '-')} ${valueOf(ratings, 'mawp_unit', '')}` },
          { label: 'MOP', value: `${valueOf(ratings, 'mop', '-')} ${valueOf(ratings, 'mop_unit', '')}` },
          { label: 'Vacuum design pressure', value: valueOf(ratings, 'vacuum_design_pressure') },
          { label: 'Hydrotest pressure', value: valueOf(ratings, 'hydrotest_pressure') },
          { label: 'Pneumatic test pressure', value: valueOf(ratings, 'pneumatic_test_pressure') },
          { label: 'Min design temperature', value: valueOf(ratings, 'min_design_temperature') },
          { label: 'Max design temperature', value: valueOf(ratings, 'max_design_temperature') },
          { label: 'MDMT', value: valueOf(ratings, 'minimum_design_metal_temperature') },
          { label: 'Design life years', value: valueOf(ratings, 'design_life_years') },
          { label: 'Cyclic service', value: valueOf(ratings, 'cyclic_service') },
          { label: 'Fatigue consideration', value: valueOf(ratings, 'fatigue_consideration') }
        ]} />
      </PsiCard>
    </div>
  );
}
