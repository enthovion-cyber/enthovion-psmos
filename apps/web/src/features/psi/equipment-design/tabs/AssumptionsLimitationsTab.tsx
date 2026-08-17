import { EquipmentDesignFieldGrid, valueOf } from '../EquipmentDesignFieldGrid';
import { PsiCard } from '../../shared/PsiUi';
import type { EquipmentDesignDetail } from '../../types/equipment-design.types';

export function AssumptionsLimitationsTab({ detail }: { detail: EquipmentDesignDetail }) {
  const assumptions = detail.assumptions;
  return (
    <PsiCard title="Assumptions / Limitations" subtitle="Known assumptions, limitations, unavailable data basis, unresolved design questions, MOC impact, and review rationale.">
      <EquipmentDesignFieldGrid items={[
        { label: 'Design assumptions', value: valueOf(assumptions, 'design_assumptions') },
        { label: 'Design limitations', value: valueOf(assumptions, 'design_limitations') },
        { label: 'Unavailable data reason', value: valueOf(assumptions, 'unavailable_data_reason') },
        { label: 'Basis confidence', value: valueOf(assumptions, 'basis_confidence') },
        { label: 'Temporary assumption', value: valueOf(assumptions, 'temporary_assumption') },
        { label: 'Assumption expiry date', value: valueOf(assumptions, 'assumption_expiry_date') },
        { label: 'MOC impact', value: valueOf(assumptions, 'moc_impact') },
        { label: 'PSSR impact', value: valueOf(assumptions, 'pssr_impact') },
        { label: 'Review required', value: valueOf(assumptions, 'review_required') },
        { label: 'Review rationale', value: valueOf(assumptions, 'review_rationale') }
      ]} />
    </PsiCard>
  );
}
