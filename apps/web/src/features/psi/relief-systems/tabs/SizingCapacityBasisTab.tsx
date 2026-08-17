import { PsiCard } from '../../shared/PsiUi';
import type { ReliefSystemDetail } from '../../types/relief-system.types';
import { ReliefCapacityComparisonPanel } from '../ReliefCapacityComparisonPanel';
import { ReliefSystemFieldGrid, valueOf } from '../ReliefSystemFieldGrid';

export function SizingCapacityBasisTab({ detail }: { detail: ReliefSystemDetail }) {
  const row = detail.sizingBasis ?? detail.reliefBasis;
  const fields = row as Record<string, unknown>;
  return (
    <div className="space-y-5">
      <ReliefCapacityComparisonPanel detail={detail} />
      <PsiCard title="Sizing / Capacity Basis" subtitle="Required rate, rated capacity, capacity margin, calculation method, governing scenario, MAWP/set pressure relationship, and calculation document.">
        <ReliefSystemFieldGrid items={[
          { label: 'Required relief rate', value: `${valueOf(row, 'required_relief_rate', 'Missing')} ${valueOf(row, 'required_relief_rate_unit', '')}`, tone: row.required_relief_rate ? 'normal' : 'warn' },
          { label: 'Rated capacity', value: `${valueOf(row, 'rated_capacity', 'Missing')} ${valueOf(row, 'rated_capacity_unit', '')}`, tone: row.rated_capacity ? 'normal' : 'warn' },
          { label: 'Capacity margin percent', value: valueOf(row, 'capacity_margin_percent') },
          { label: 'Set pressure', value: `${valueOf(row, 'set_pressure', 'Missing')} ${valueOf(row, 'set_pressure_unit', '')}` },
          { label: 'MAWP', value: valueOf(row, 'mawp') },
          { label: 'Relieving pressure', value: valueOf(row, 'relieving_pressure') },
          { label: 'Methodology basis', value: valueOf(row, 'methodology_basis') },
          { label: 'Calculation status', value: valueOf(row, 'calculation_status'), tone: row.calculation_status === 'Complete' ? 'normal' : 'warn' },
          { label: 'Calculation document', value: valueOf(row, 'calculation_document_id'), tone: fields.calculation_document_id ? 'normal' : 'warn' }
        ]} />
      </PsiCard>
    </div>
  );
}
