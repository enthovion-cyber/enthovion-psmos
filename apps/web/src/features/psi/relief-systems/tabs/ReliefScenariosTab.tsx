import { PsiCard, PsiEmptyState } from '../../shared/PsiUi';
import { GoverningCaseBadge } from '../../shared/GoverningCaseBadge';
import { ReliefScenarioBadge } from '../../shared/ReliefScenarioBadge';
import type { ReliefSystemDetail } from '../../types/relief-system.types';
import { ReliefSystemFieldGrid, valueOf } from '../ReliefSystemFieldGrid';

export function ReliefScenariosTab({ detail }: { detail: ReliefSystemDetail }) {
  return (
    <PsiCard title="Relief Scenarios" subtitle="Scenario register with governing case, basis, relieving conditions, required rate, assumptions, calculation status, and linked cause/source records.">
      {!detail.scenarios.length ? <PsiEmptyState title="No relief scenarios" message="Create at least one relief scenario and mark the governing case." /> : (
        <div className="space-y-4">{detail.scenarios.map((row) => <div key={String(row.id ?? row.scenario_type)} className="space-y-3 rounded-xl border border-[var(--psm-line)] p-3"><div className="flex flex-wrap gap-2"><ReliefScenarioBadge value={String(row.scenario_type ?? '')} /><GoverningCaseBadge value={Boolean(row.governing_case)} /></div><ReliefSystemFieldGrid items={[
          { label: 'Scenario description', value: valueOf(row, 'scenario_description') },
          { label: 'Required relief rate', value: `${valueOf(row, 'required_relief_rate', 'Missing')} ${valueOf(row, 'required_relief_rate_unit', '')}` },
          { label: 'Relieving pressure', value: valueOf(row, 'relieving_pressure') },
          { label: 'Relieving temperature', value: valueOf(row, 'relieving_temperature') },
          { label: 'Calculation status', value: valueOf(row, 'calculation_status') },
          { label: 'Basis document', value: valueOf(row, 'basis_document_id') }
        ]} /></div>)}</div>
      )}
    </PsiCard>
  );
}
