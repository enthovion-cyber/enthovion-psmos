import type { PsiUnitDetailResponse } from '../../types/psi-unit.types';
import { CompletenessChecklist } from '../../completeness/CompletenessChecklist';
import { CompletenessScoreCard } from '../../completeness/CompletenessScoreCard';
import { MissingPsiItemsTable } from '../../completeness/MissingPsiItemsTable';
import { LiveEquipmentBaselineTable } from '../../completeness/LiveEquipmentBaselineTable';
import { PsiButton } from '../../shared/PsiUi';

export function PsiCompletenessTab({ detail, onRun, isRunning }: { detail: PsiUnitDetailResponse; onRun?: () => void; isRunning?: boolean }) {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <PsiButton onClick={onRun ?? (() => undefined)} disabled={Boolean(isRunning)}>
          {isRunning ? 'Running...' : 'Run Completeness Check'}
        </PsiButton>
      </div>
      <CompletenessScoreCard completeness={detail.completeness} />
      <LiveEquipmentBaselineTable
        unitId={detail.unit.id}
        unitCode={detail.unit.unit_code}
        unitName={detail.unit.unit_name}
      />
      <MissingPsiItemsTable rows={detail.completeness.missingItems} />
      <CompletenessChecklist rows={detail.completeness.evaluations} />
    </div>
  );
}
