import { PsiCard, PsiMetricCard } from '../../shared/PsiUi';
import type { ReliefSystemDetail } from '../../types/relief-system.types';
import { GoverningScenarioPanel } from '../GoverningScenarioPanel';
import { ReliefCapacityComparisonPanel } from '../ReliefCapacityComparisonPanel';
import { ReliefSystemFieldGrid, valueOf } from '../ReliefSystemFieldGrid';

export function ReliefOverviewTab({ detail }: { detail: ReliefSystemDetail }) {
  const basis = detail.reliefBasis;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {detail.overview.cards.map((card) => <PsiMetricCard key={card.label} label={card.label} value={String(card.value ?? '0')} tone={card.tone ?? 'neutral'} />)}
      </div>
      <ReliefCapacityComparisonPanel detail={detail} />
      <GoverningScenarioPanel rows={detail.scenarios} />
      <PsiCard title="Relief Basis Snapshot" subtitle="Core identity, protected equipment, device, sizing, destination, MOC, PSSR, and review state.">
        <ReliefSystemFieldGrid items={[
          { label: 'Protected equipment', value: `${basis.protected_equipment_tag} - ${basis.protected_equipment_name}` },
          { label: 'Relief system type', value: valueOf(basis, 'relief_system_type') },
          { label: 'Device tag', value: valueOf(basis, 'relief_device_tag') },
          { label: 'Set pressure', value: `${basis.set_pressure ?? 'Missing'} ${basis.set_pressure_unit ?? ''}`, tone: basis.set_pressure ? 'normal' : 'warn' },
          { label: 'MAWP', value: `${basis.mawp ?? 'Missing'} ${basis.mawp_unit ?? ''}` },
          { label: 'Relief destination', value: valueOf(basis, 'relief_destination'), tone: basis.relief_destination ? 'normal' : 'warn' },
          { label: 'Calculation status', value: valueOf(basis, 'calculation_status'), tone: basis.calculation_status === 'Complete' ? 'normal' : 'warn' },
          { label: 'Review status', value: valueOf(basis, 'review_status') },
          { label: 'Next review due', value: valueOf(basis, 'next_review_due') }
        ]} />
      </PsiCard>
    </div>
  );
}
