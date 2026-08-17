import { RiskMatrixCell } from '../../shared/RiskMatrixCell';
import type { CriticalityAssessment } from '../../types/criticality.types';

export function RiskScoreBreakdown({ current }: { current?: CriticalityAssessment | null }) {
  return <RiskMatrixCell consequence={current?.consequence_score} likelihood={current?.likelihood_score} score={current?.final_risk_score} />;
}
